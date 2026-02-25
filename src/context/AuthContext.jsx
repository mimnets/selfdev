import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // { name, picture, email }
    const [token, setToken] = useState(null); // Access Token
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);

    // Persist Login
    useEffect(() => {
        try {
            const savedToken = localStorage.getItem('google_access_token');
            const savedUser = localStorage.getItem('google_user_profile');
            if (savedToken) setToken(savedToken);
            if (savedUser) setUser(JSON.parse(savedUser));
        } catch {
            console.error('Failed to parse saved user profile');
        }
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
        },
        onError: error => console.error('Login Failed', error),
        scope: 'https://www.googleapis.com/auth/drive.file',
    });

    const logout = () => {
        googleLogout();
        setToken(null);
        setUser(null);
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_user_profile');
    };

    // --- Google Drive Logic (manual backup/restore only) ---

    const FOLDER_NAME = 'Gravity Planner Data';
    const BACKUP_FILENAME = 'gravity_planner_backup.json';

    const [rootFolderId, setRootFolderId] = useState(null);

    useEffect(() => {
        try {
            const savedFolder = localStorage.getItem('google_drive_folder_id');
            if (savedFolder) setRootFolderId(savedFolder);
        } catch {
            console.error('Failed to load folder setting');
        }
    }, []);

    const setFolder = (id) => {
        setRootFolderId(id);
        localStorage.setItem('google_drive_folder_id', id);
    };

    const rootFolderIdRef = useRef(rootFolderId);
    useEffect(() => { rootFolderIdRef.current = rootFolderId; }, [rootFolderId]);

    const findOrCreateFolder = useCallback(async (accessToken) => {
        if (rootFolderIdRef.current) return rootFolderIdRef.current;

        try {
            const res = await axios.get('https://www.googleapis.com/drive/v3/files', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    q: `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                    fields: 'files(id, name)'
                }
            });

            if (res.data.files.length > 0) {
                const id = res.data.files[0].id;
                setFolder(id);
                return id;
            } else {
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
    }, []);

    const findBackupFile = useCallback(async (accessToken, folderId) => {
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
    }, []);

    // Manual backup to Google Drive
    const backupData = useCallback(async () => {
        if (!token) return;
        setIsSyncing(true);

        let plannerState = {};
        try {
            plannerState = JSON.parse(localStorage.getItem('planner-state') || '{}');
        } catch {
            console.error('Failed to read planner state for backup');
            setIsSyncing(false);
            return;
        }

        const dataToSave = {
            activities: plannerState.activities || [],
            categories: plannerState.categories || {},
            members: plannerState.members || [],
            goals: plannerState.goals || [],
            customRules: plannerState.customRules || {},
            currentActivity: plannerState.currentActivities || {},
            acknowledgedReminders: plannerState.acknowledgedReminders || [],
            backupTimestamp: new Date().toISOString()
        };

        const fileContent = JSON.stringify(dataToSave, null, 2);
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
                await axios.patch(
                    `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
                    file,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
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
    }, [token, findOrCreateFolder, findBackupFile]);

    const restoreData = useCallback(async () => {
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

                let currentState = {};
                try {
                    currentState = JSON.parse(localStorage.getItem('planner-state') || '{}');
                } catch { /* ignore */ }
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
    }, [token, findOrCreateFolder, findBackupFile]);

    const listFolders = useCallback(async () => {
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
    }, [token]);

    return (
        <AuthContext.Provider value={{
            user, login, logout,
            backupData, restoreData, isSyncing, lastSynced,
            listFolders, rootFolderId, setFolder,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
