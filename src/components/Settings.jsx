import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import { User, LogOut, Cloud, Download, Upload, ShieldCheck, Briefcase, GraduationCap, Palette, Check } from 'lucide-react';

const Settings = () => {
    const { state, updateSessionRequirement, setTheme } = usePlanner();
    const { members, currentMemberId, sessionRequirements } = state;
    const currentMember = members.find(m => m.id === currentMemberId) || members[0];
    const requirement = sessionRequirements[currentMemberId] || { dailyTarget: 8, label: currentMemberId === 'me' ? 'Work' : 'School' };

    const {
        user, login, logout,
        backupData, restoreData, isSyncing, lastSynced,
        listFolders, rootFolderId, setFolder,
        autoBackup, toggleAutoBackup
    } = useAuth();

    const [showFolderModal, setShowFolderModal] = React.useState(false);
    const [folders, setFolders] = React.useState([]);
    const [loadingFolders, setLoadingFolders] = React.useState(false);

    const handleOpenFolderPicker = async () => {
        setShowFolderModal(true);
        setLoadingFolders(true);
        const f = await listFolders();
        setFolders(f);
        setLoadingFolders(false);
    };

    return (
        <div style={{ padding: '24px', paddingBottom: '100px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#fff' }}>Profile & Settings</h1>

            {/* Profile Card */}
            <div style={{
                background: '#1a1a1a',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                {user ? (
                    <>
                        <img
                            src={user.picture}
                            alt="Profile"
                            style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid #00ff88' }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>{user.name}</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>{user.email}</div>
                        </div>
                        <button
                            onClick={logout}
                            style={{
                                background: '#333',
                                border: 'none',
                                color: '#fff',
                                padding: '10px',
                                borderRadius: '50%',
                                cursor: 'pointer'
                            }}
                        >
                            <LogOut size={20} />
                        </button>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: '#333',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <User size={30} color="#666" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Guest User</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>Sign in to sync data</div>
                        </div>
                        <button
                            onClick={() => login()}
                            style={{
                                background: '#00ff88',
                                border: 'none',
                                color: '#000',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            Sign In
                        </button>
                    </>
                )}
            </div>

            {/* NEW: Official Session Configuration */}
            <div style={{
                background: '#1a1a1a',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                borderLeft: `4px solid ${currentMemberId === 'me' ? '#3b82f6' : '#8b5cf6'}`
            }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {currentMemberId === 'me' ? <Briefcase size={18} color="#3b82f6" /> : <GraduationCap size={18} color="#8b5cf6" />}
                    Session Requirements ({requirement.label})
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>SESSION LABEL</label>
                        <input
                            type="text"
                            value={requirement.label}
                            onChange={(e) => updateSessionRequirement(currentMemberId, { label: e.target.value })}
                            placeholder="e.g. Work, School, Freelance"
                            style={{
                                width: '100%',
                                background: '#222',
                                border: '1px solid #333',
                                borderRadius: '12px',
                                padding: '12px',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>DAILY TARGET HOURS</label>
                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{requirement.dailyTarget}h</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="16"
                            step="0.5"
                            value={requirement.dailyTarget}
                            onChange={(e) => updateSessionRequirement(currentMemberId, { dailyTarget: parseFloat(e.target.value) })}
                            style={{
                                width: '100%',
                                accentColor: currentMemberId === 'me' ? '#3b82f6' : '#8b5cf6',
                                cursor: 'pointer'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#444' }}>
                            <span>1h</span>
                            <span>8h</span>
                            <span>16h</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* NEW: Visual Themes */}
            <div style={{
                background: '#1a1a1a',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Palette size={18} color="#00ff88" />
                    Visual Theme
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {[
                        { id: 'dark', label: 'Gravity Dark', bg: '#050505', text: '#fff' },
                        { id: 'light', label: 'Gravity Light', bg: '#f8fafc', text: '#0f172a' },
                        { id: 'midnight', label: 'Midnight Blue', bg: '#0f172a', text: '#f8fafc' },
                        { id: 'paper', label: 'Amanah Paper', bg: '#fdfaf6', text: '#433422' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTheme(t.id)}
                            style={{
                                background: t.bg,
                                border: `2px solid ${state.theme === t.id ? '#00ff88' : '#333'}`,
                                borderRadius: '16px',
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: '0.2s',
                                position: 'relative'
                            }}
                        >
                            <div style={{ fontSize: '11px', fontWeight: 'bold', color: t.text }}>{t.label}</div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88' }} />
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa' }} />
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#facc15' }} />
                            </div>
                            {state.theme === t.id && (
                                <div style={{
                                    position: 'absolute', top: '-6px', right: '-6px',
                                    background: '#00ff88', color: '#000', borderRadius: '50%',
                                    width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Check size={12} strokeWidth={4} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cloud Sync Section */}
            {user && (
                <div style={{
                    background: '#1a1a1a',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Cloud size={20} color="#00ff88" />
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Google Drive</span>
                        </div>
                        {/* Auto Backup Toggle */}
                        <div
                            onClick={() => toggleAutoBackup(!autoBackup)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        >
                            <span style={{ fontSize: '12px', color: autoBackup ? '#00ff88' : '#666' }}>
                                {autoBackup ? 'Auto-Sync ON' : 'Auto-Sync OFF'}
                            </span>
                            <div style={{
                                width: '36px', height: '20px', background: autoBackup ? '#00ff88' : '#333',
                                borderRadius: '20px', position: 'relative', transition: '0.3s'
                            }}>
                                <div style={{
                                    width: '16px', height: '16px', background: '#fff', borderRadius: '50%',
                                    position: 'absolute', top: '2px', left: autoBackup ? '18px' : '2px', transition: '0.3s'
                                }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                        <button
                            onClick={backupData}
                            disabled={isSyncing}
                            style={{
                                flex: 1,
                                background: '#333',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: isSyncing ? 'not-allowed' : 'pointer',
                                opacity: isSyncing ? 0.6 : 1
                            }}
                        >
                            <Upload size={24} color="#00ff88" />
                            <span style={{ fontSize: '12px', color: '#fff' }}>Backup Now</span>
                        </button>

                        <button
                            onClick={restoreData}
                            disabled={isSyncing}
                            style={{
                                flex: 1,
                                background: '#333',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: isSyncing ? 'not-allowed' : 'pointer',
                                opacity: isSyncing ? 0.6 : 1
                            }}
                        >
                            <Download size={24} color="#4ade80" />
                            <span style={{ fontSize: '12px', color: '#fff' }}>Restore Data</span>
                        </button>
                    </div>

                    {/* Folder Selection Display */}
                    <div style={{ background: '#222', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#888' }}>BACKUP FOLDER</div>
                            <div style={{ fontSize: '12px', color: '#ccc', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {rootFolderId ? (rootFolderId === 'root' ? 'My Drive (Root)' : 'Custom Folder') : 'Default (Gravity Planner Data)'}
                            </div>
                        </div>
                        <button
                            onClick={handleOpenFolderPicker}
                            style={{ background: 'transparent', border: '1px solid #444', color: '#ccc', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                        >
                            Change
                        </button>
                    </div>

                    <div style={{ marginTop: '20px', fontSize: '11px', color: '#666', textAlign: 'center' }}>
                        {isSyncing ? 'Syncing...' : (
                            lastSynced ? `Last Synced: ${lastSynced.toLocaleTimeString()}` : 'Not synced recently'
                        )}
                    </div>
                </div>
            )}

            {/* Folder Picker Modal */}
            {showFolderModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#1a1a1a', borderRadius: '24px', width: '90%', maxWidth: '400px', padding: '24px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Select Folder</h2>
                            <button onClick={() => setShowFolderModal(false)} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {loadingFolders ? (
                                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Loading folders...</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {folders.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => { setFolder(f.id); setShowFolderModal(false); }}
                                            style={{
                                                background: rootFolderId === f.id ? '#333' : 'transparent',
                                                border: '1px solid #333', borderRadius: '12px', padding: '12px',
                                                textAlign: 'left', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Cloud size={16} color="#666" />
                                            {f.name}
                                        </button>
                                    ))}
                                    {folders.length === 0 && <div style={{ color: '#666', textAlign: 'center' }}>No folders found in root.</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
