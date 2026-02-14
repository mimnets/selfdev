import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';
import { usePlanner } from './PlannerContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { name, picture, email }
    const [token, setToken] = useState(null); // Access Token
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);
    const { state, addRetroactive, stopActivity } = usePlanner(); // To inject data on restore

    // Persist Login
    useEffect(() => {
        const savedToken = localStorage.getItem('google_access_token');
        const savedUser = localStorage.getItem('google_user_profile');
        if (savedToken) setToken(savedToken);
        if (savedUser) setUser(JSON.parse(savedUser));
    }, []);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            const accessToken = tokenResponse.access_token;
            setToken(accessToken);
            localStorage.setItem('google_access_token', accessToken);

            // Fetch Profile
            try {
                const res = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { alt: 'json' }
                });
                setUser(res.data);
                localStorage.setItem('google_user_profile', JSON.stringify(res.data));
            } catch (err) {
                console.error('Failed to fetch user profile', err);
            }

            // Auto Restore or Check Backup existence?
            // checking backup existence is better
            checkForBackup(accessToken);
        },
        onError: error => console.error('Login Failed', error),
        scope: 'https://www.googleapis.com/auth/drive.file', // Access to files created by app
    });

    const logout = () => {
        googleLogout();
        setToken(null);
        setUser(null);
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_user_profile');
    };

    // --- Google Drive Logic ---

    const FOLDER_NAME = 'Gravity Planner Data';
    const BACKUP_FILENAME = 'gravity_planner_backup.json';
    const [hasCheckedBackup, setHasCheckedBackup] = useState(false);

    const checkForBackup = async (accessToken) => {
        if (hasCheckedBackup) return;
        try {
            const folderId = await findOrCreateFolder(accessToken);
            const backupFile = await findBackupFile(accessToken, folderId);
            if (backupFile) {
                const localData = JSON.parse(localStorage.getItem('planner-state') || '{}');
                const hasLocalData = localData.activities?.length > 0 || localData.members?.length > 1;

                if (!hasLocalData) {
                    if (window.confirm('Found a backup on Google Drive. Would you like to restore your data?')) {
                        await restoreDataWithToken(accessToken);
                    }
                }
            }
            setHasCheckedBackup(true);
        } catch (err) {
            console.error('Check for backup failed', err);
        }
    };

    const restoreDataWithToken = async (accessToken) => {
        setIsSyncing(true);
        try {
            const folderId = await findOrCreateFolder(accessToken);
            const existingFile = await findBackupFile(accessToken, folderId);

            if (existingFile) {
                const res = await axios.get(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const data = res.data;

                const currentState = JSON.parse(localStorage.getItem('planner-state') || '{}');
                const newState = {
                    ...currentState,
                    activities: data.activities || [],
                    currentActivity: data.currentActivity || null,
                    categories: data.categories || currentState.categories,
                    members: data.members || currentState.members,
                    goals: data.goals || currentState.goals || [],
                    customRules: data.customRules || currentState.customRules || {},
                    acknowledgedReminders: data.acknowledgedReminders || currentState.acknowledgedReminders || []
                };
                localStorage.setItem('planner-state', JSON.stringify(newState));
                window.location.reload();
            }
        } catch (err) {
            console.error('Restore with token failed', err);
        } finally {
            setIsSyncing(false);
        }
    };



    // Helper: Find existing backup file INSIDE the folder
    const findBackupFile = async (accessToken, folderId) => {
        if (!folderId) return null;
        try {
            const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `name = '${BACKUP_FILENAME}' and '${folderId}' in parents and trashed = false`,
                    fields: 'files(id, name)'
                }
            });
            if (res.data.files.length > 0) return res.data.files[0];
            return null;
        } catch (err) {
            console.error('Error searching backup', err);
            return null;
        }
    };

    const backupData = async () => {
        if (!token) return;
        setIsSyncing(true);

        const dataToSave = {
            activities: state.activities,
            categories: state.categories,
            members: state.members,
            goals: state.goals,
            customRules: state.customRules,
            currentActivity: state.currentActivity,
            acknowledgedReminders: state.acknowledgedReminders,
            backupTimestamp: new Date().toISOString()
        };

        const fileContent = JSON.stringify(dataToSave, null, 2); // Pretty print for user readability
        const file = new Blob([fileContent], { type: 'application/json' });

        try {
            const folderId = await findOrCreateFolder(token);
            if (!folderId) throw new Error("Could not create folder");

            const metadata = {
                name: BACKUP_FILENAME,
                mimeType: 'application/json',
                parents: [folderId]
            };

            const existingFile = await findBackupFile(token, folderId);

            if (existingFile) {
                // Update (PATCH)
                await axios.patch(
                    `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
                    file,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                // Create (Multipart)
                const formData = new FormData();
                formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                formData.append('file', file);

                await axios.post(
                    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setLastSynced(new Date());
        } catch (err) {
            console.error('Backup failed', err);
            if (err.response?.status === 401) logout();
        } finally {
            setIsSyncing(false);
        }
    };

    const restoreData = async () => {
        if (!token) return;
        setIsSyncing(true);
        try {
            const folderId = await findOrCreateFolder(token);
            const existingFile = await findBackupFile(token, folderId);

            if (existingFile) {
                const res = await axios.get(`https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = res.data;

                // We need a way to REPLACE state in PlannerContext.
                // For now, we can perhaps reload the page with new localStorage?
                // OR add a 'IMPORT_DATA' action.
                // Let's assume we update localStorage and reload for safety/simplicity in V1,
                // or better, dispatch an action.

                // Let's use localStorage injection + reload for robust full state reset
                const currentState = JSON.parse(localStorage.getItem('planner-state') || '{}');
                const newState = {
                    ...currentState,
                    activities: data.activities || [],
                    currentActivity: data.currentActivity || null,
                    categories: data.categories || currentState.categories,
                    members: data.members || currentState.members,
                    goals: data.goals || currentState.goals || [],
                    customRules: data.customRules || currentState.customRules || {},
                    acknowledgedReminders: data.acknowledgedReminders || currentState.acknowledgedReminders || []
                };
                localStorage.setItem('planner-state', JSON.stringify(newState));
                window.location.reload();
            } else {
                alert('No backup found.');
            }
        } catch (err) {
            console.error('Restore failed', err);
        } finally {
            setIsSyncing(false);
        }
    };

    // --- Folder Management ---
    const [rootFolderId, setRootFolderId] = useState(null);
    const [autoBackup, setAutoBackup] = useState(true);

    useEffect(() => {
        const savedFolder = localStorage.getItem('google_drive_folder_id');
        const savedAuto = localStorage.getItem('settings_auto_backup');
        if (savedFolder) setRootFolderId(savedFolder);
        if (savedAuto !== null) setAutoBackup(JSON.parse(savedAuto));
    }, []);

    const setFolder = (id) => {
        setRootFolderId(id);
        localStorage.setItem('google_drive_folder_id', id);
    };

    const toggleAutoBackup = (val) => {
        setAutoBackup(val);
        localStorage.setItem('settings_auto_backup', JSON.stringify(val));
    };

    const listFolders = async () => {
        if (!token) return [];
        try {
            const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents",
                    fields: 'files(id, name)',
                    pageSize: 20
                }
            });
            return res.data.files;
        } catch (err) {
            console.error('List folders failed', err);
            return [];
        }
    };

    // --- Auto Backup Effect ---
    useEffect(() => {
        if (!user || !autoBackup) return;

        const timer = setTimeout(() => {
            if (state.activities.length > 0) {
                // console.log('Auto-backing up...');
                backupData(); // Trigger backup
            }
        }, 5000); // 5 second debounce

        return () => clearTimeout(timer);
    }, [state, autoBackup, user]); // Depend on entire state for robust auto-backup

    // Update findOrCreateFolder to use rootFolderId if selected
    const findOrCreateFolder = async (accessToken) => {
        if (rootFolderId) return rootFolderId; // Use selected folder if available

        // Fallback to default 'Gravity Planner Data' logic
        try {
            // Check if folder exists
            const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                    fields: 'files(id, name)'
                }
            });

            if (res.data.files.length > 0) {
                const id = res.data.files[0].id;
                setFolder(id); // Auto-save this as preferred
                return id;
            } else {
                // Create Folder
                const folderMetadata = {
                    name: FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder',
                };
                const createRes = await axios.post('https://www.googleapis.com/drive/v3/files', folderMetadata, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                const id = createRes.data.id;
                setFolder(id);
                return id;
            }
        } catch (err) {
            console.error('Error finding/creating folder', err);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{
            user, login, logout,
            backupData, restoreData, isSyncing, lastSynced,
            listFolders, rootFolderId, setFolder,
            autoBackup, toggleAutoBackup
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
