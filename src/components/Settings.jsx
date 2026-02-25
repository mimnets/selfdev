import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../context/AuthContext';
import { usePlanner } from '../context/PlannerContext';
import { usePocketBase } from '../context/SupabaseContext';
import { User, LogOut, Cloud, Download, Upload, Briefcase, Palette, Check, Plus, Pencil, Trash2, X, Shield, Lock } from 'lucide-react';
import { hashPin } from '../utils/pinHash';

const SESSION_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6'];

const Settings = () => {
    const { state, addSessionType, updateSessionType, deleteSessionType, setTheme, setParentPin } = usePlanner();
    const { currentMemberId, sessionTypes, members, parentPin } = state;
    const currentMember = members.find(m => m.id === currentMemberId);
    const isAdmin = currentMember?.role === 'admin';
    const memberSessions = sessionTypes[currentMemberId] || [];

    const { user: pbUser, signOut } = usePocketBase();
    const {
        user, login, logout,
        backupData, restoreData, isSyncing, lastSynced,
        listFolders, rootFolderId, setFolder,
    } = useAuth();

    const [editingSessionId, setEditingSessionId] = useState(null);
    const [showAddSession, setShowAddSession] = useState(false);
    const [newSession, setNewSession] = useState({ label: '', dailyTarget: 8, color: '#3b82f6', icon: 'briefcase' });

    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folders, setFolders] = useState([]);
    const [loadingFolders, setLoadingFolders] = useState(false);

    // Parental Controls state
    const [showPinSetup, setShowPinSetup] = useState(false);
    const [pinDigits, setPinDigits] = useState(['', '', '', '']);

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

            {/* Account Card */}
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
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#fff'
                }}>
                    {(pbUser?.name || pbUser?.email || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
                        {pbUser?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{pbUser?.email}</div>
                </div>
                <button
                    onClick={signOut}
                    title="Sign Out"
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
            </div>

            {/* Google Drive Profile Card */}
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
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>Google Drive Backup</div>
                            <div style={{ fontSize: '12px', color: '#888' }}>Sign in to enable backups</div>
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

            {/* Session Types CRUD */}
            <div style={{
                background: '#1a1a1a',
                borderRadius: '24px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={18} color="#3b82f6" />
                        Session Types
                    </div>
                    <button
                        onClick={() => { setShowAddSession(true); setNewSession({ label: '', dailyTarget: 8, color: SESSION_COLORS[memberSessions.length % SESSION_COLORS.length], icon: 'briefcase' }); }}
                        style={{
                            background: '#333', border: 'none', color: '#fff', borderRadius: '50%',
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {memberSessions.map(st => (
                        <div key={st.id} style={{
                            background: '#222', borderRadius: '16px', padding: '16px',
                            borderLeft: `4px solid ${st.color}`
                        }}>
                            {editingSessionId === st.id ? (
                                /* Edit Mode */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <input
                                        type="text"
                                        value={st.label}
                                        onChange={(e) => updateSessionType(currentMemberId, st.id, { label: e.target.value })}
                                        placeholder="Session label"
                                        style={{
                                            width: '100%', background: '#1a1a1a', border: '1px solid #444',
                                            borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box'
                                        }}
                                    />
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>DAILY TARGET</span>
                                            <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{st.dailyTarget}h</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="16" step="0.5"
                                            value={st.dailyTarget}
                                            onChange={(e) => updateSessionType(currentMemberId, st.id, { dailyTarget: parseFloat(e.target.value) })}
                                            style={{ width: '100%', accentColor: st.color, cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div>
                                        <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>COLOR</span>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {SESSION_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => updateSessionType(currentMemberId, st.id, { color: c })}
                                                    style={{
                                                        width: '28px', height: '28px', borderRadius: '50%', background: c,
                                                        border: st.color === c ? '3px solid #fff' : '2px solid transparent',
                                                        cursor: 'pointer', padding: 0
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingSessionId(null)}
                                        style={{
                                            background: st.color, border: 'none', color: '#fff', borderRadius: '8px',
                                            padding: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                                        }}
                                    >
                                        Done
                                    </button>
                                </div>
                            ) : (
                                /* View Mode */
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: st.color }} />
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{st.label}</div>
                                            <div style={{ fontSize: '11px', color: '#888' }}>{st.dailyTarget}h daily target</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => setEditingSessionId(st.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Pencil size={16} color="#888" />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Delete this session type?')) deleteSessionType(currentMemberId, st.id); }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                                        >
                                            <Trash2 size={16} color="#ef4444" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {memberSessions.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#666', padding: '16px', fontSize: '13px' }}>
                            No session types yet. Add one to start tracking.
                        </div>
                    )}
                </div>

                {/* Add Session Form */}
                {showAddSession && (
                    <div style={{ marginTop: '16px', background: '#222', borderRadius: '16px', padding: '16px', borderLeft: `4px solid ${newSession.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>New Session Type</span>
                            <button onClick={() => setShowAddSession(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <X size={16} color="#888" />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                type="text"
                                value={newSession.label}
                                onChange={(e) => setNewSession({ ...newSession, label: e.target.value })}
                                placeholder="e.g. Work, Study, Freelance"
                                style={{
                                    width: '100%', background: '#1a1a1a', border: '1px solid #444',
                                    borderRadius: '8px', padding: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>DAILY TARGET</span>
                                    <span style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>{newSession.dailyTarget}h</span>
                                </div>
                                <input
                                    type="range" min="1" max="16" step="0.5"
                                    value={newSession.dailyTarget}
                                    onChange={(e) => setNewSession({ ...newSession, dailyTarget: parseFloat(e.target.value) })}
                                    style={{ width: '100%', accentColor: newSession.color, cursor: 'pointer' }}
                                />
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>COLOR</span>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {SESSION_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNewSession({ ...newSession, color: c })}
                                            style={{
                                                width: '28px', height: '28px', borderRadius: '50%', background: c,
                                                border: newSession.color === c ? '3px solid #fff' : '2px solid transparent',
                                                cursor: 'pointer', padding: 0
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (!newSession.label.trim()) return;
                                    addSessionType(currentMemberId, { ...newSession, id: uuidv4() });
                                    setShowAddSession(false);
                                    setNewSession({ label: '', dailyTarget: 8, color: SESSION_COLORS[(memberSessions.length + 1) % SESSION_COLORS.length], icon: 'briefcase' });
                                }}
                                disabled={!newSession.label.trim()}
                                style={{
                                    background: newSession.label.trim() ? newSession.color : '#444',
                                    border: 'none', color: '#fff', borderRadius: '8px',
                                    padding: '10px', fontSize: '13px', fontWeight: 'bold',
                                    cursor: newSession.label.trim() ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Add Session Type
                            </button>
                        </div>
                    </div>
                )}
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

            {/* Parental Controls - Admin only */}
            {isAdmin && (
                <div style={{
                    background: '#1a1a1a',
                    borderRadius: '24px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield size={18} color="#ef4444" />
                        Parental Controls
                    </div>

                    <div style={{ background: '#222', borderRadius: '16px', padding: '16px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Lock size={16} color={parentPin ? '#00ff88' : '#666'} />
                                <span style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>PIN Lock</span>
                            </div>
                            <span style={{
                                fontSize: '11px', fontWeight: 'bold',
                                color: parentPin ? '#00ff88' : '#888',
                                background: parentPin ? '#00ff8822' : '#333',
                                padding: '4px 10px', borderRadius: '12px'
                            }}>
                                {parentPin ? 'ACTIVE' : 'NOT SET'}
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#888', margin: '0 0 12px' }}>
                            When set, child accounts need this PIN to switch members, access Circles, or open Settings.
                        </p>

                        {!showPinSetup ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => { setShowPinSetup(true); setPinDigits(['', '', '', '']); }}
                                    style={{
                                        flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                                        background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {parentPin ? 'Change PIN' : 'Set PIN'}
                                </button>
                                {parentPin && (
                                    <button
                                        onClick={() => {
                                            if (confirm('Remove parental PIN? Child accounts will have unrestricted access.')) {
                                                setParentPin(null);
                                            }
                                        }}
                                        style={{
                                            padding: '10px 16px', borderRadius: '12px', border: 'none',
                                            background: '#ef444433', color: '#ef4444', fontSize: '13px', fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }}>
                                    {pinDigits.map((digit, i) => (
                                        <input
                                            key={i}
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={1}
                                            autoFocus={i === 0}
                                            value={digit}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (!/^\d?$/.test(val)) return;
                                                const newDigits = [...pinDigits];
                                                newDigits[i] = val;
                                                setPinDigits(newDigits);
                                                if (val && i < 3) {
                                                    const next = e.target.parentElement.children[i + 1];
                                                    next?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !pinDigits[i] && i > 0) {
                                                    const prev = e.target.parentElement.children[i - 1];
                                                    prev?.focus();
                                                }
                                            }}
                                            style={{
                                                width: '48px', height: '56px', background: '#1a1a1a',
                                                border: `2px solid ${digit ? '#00ff88' : '#444'}`,
                                                borderRadius: '12px', color: '#fff', fontSize: '22px',
                                                fontWeight: 'bold', textAlign: 'center', outline: 'none'
                                            }}
                                        />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => setShowPinSetup(false)}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                                            background: '#333', color: '#fff', fontSize: '13px', cursor: 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const pin = pinDigits.join('');
                                            if (pin.length === 4) {
                                                const hashed = await hashPin(pin);
                                                setParentPin(hashed);
                                                setShowPinSetup(false);
                                                setPinDigits(['', '', '', '']);
                                            }
                                        }}
                                        disabled={pinDigits.join('').length !== 4}
                                        style={{
                                            flex: 1, padding: '10px', borderRadius: '12px', border: 'none',
                                            background: pinDigits.join('').length === 4 ? '#00ff88' : '#444',
                                            color: pinDigits.join('').length === 4 ? '#000' : '#888',
                                            fontSize: '13px', fontWeight: 'bold',
                                            cursor: pinDigits.join('').length === 4 ? 'pointer' : 'not-allowed'
                                        }}
                                    >
                                        Save PIN
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

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
                        <span style={{ fontSize: '11px', color: '#666' }}>Manual Export</span>
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
