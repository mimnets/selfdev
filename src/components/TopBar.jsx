import { useState, useEffect, useRef } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Settings, Briefcase, Cloud, CloudOff, Loader, Lock } from 'lucide-react';
import { format } from 'date-fns';
import CategorySettings from './CategorySettings';
import PinModal from './PinModal';

const TopBar = () => {
    const { state, toggleSession, syncStatus } = usePlanner();
    const [showCategorySettings, setShowCategorySettings] = useState(false);
    const [showSessionPicker, setShowSessionPicker] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const pickerRef = useRef(null);
    const { members, currentMemberId, activeSessions, sessionTypes, parentPin } = state;
    const currentMember = members.find(m => m.id === currentMemberId) || members[0];
    const isChildLocked = currentMember?.role === 'child' && !!parentPin;
    const memberSessions = sessionTypes[currentMemberId] || [];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Close picker on outside click
    useEffect(() => {
        if (!showSessionPicker) return;
        const handleClick = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                setShowSessionPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showSessionPicker]);

    const dateStr = format(currentTime, 'EEE, MMM d');
    const timeStr = format(currentTime, 'hh:mm a');

    const activeSession = activeSessions[currentMemberId];
    const isSessionActive = !!activeSession;

    // Find the active session type info
    const activeSessionType = isSessionActive && activeSession.sessionTypeId
        ? memberSessions.find(st => st.id === activeSession.sessionTypeId)
        : null;
    const sessionColor = activeSessionType?.color || memberSessions[0]?.color || '#3b82f6';
    const sessionLabel = activeSessionType?.label || memberSessions[0]?.label || 'Session';

    const handleSessionClick = () => {
        if (isSessionActive) {
            // Turn off
            toggleSession(currentMemberId);
        } else if (memberSessions.length <= 1) {
            // Only one (or zero) session type — toggle directly
            toggleSession(currentMemberId, memberSessions[0]?.id);
        } else {
            // Multiple types — show picker
            setShowSessionPicker(true);
        }
    };

    const handlePickSession = (sessionTypeId) => {
        setShowSessionPicker(false);
        toggleSession(currentMemberId, sessionTypeId);
    };

    return (
        <div className="top-bar-container" style={{
            background: 'var(--color-bg)',
            borderBottom: `2px solid ${isSessionActive ? sessionColor : 'var(--color-card-border)'}`,
            boxShadow: isSessionActive ? `0 4px 20px ${sessionColor}33` : 'none',
            zIndex: 100,
            transition: 'all 0.3s ease'
        }}>
            <div className="top-bar" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                height: '72px',
                flexShrink: 0
            }}>
                {/* Left Column */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: currentMember.color || 'var(--color-card-bg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--color-card-border)',
                        fontSize: '16px', fontWeight: 'bold', color: '#000'
                    }}>
                        {currentMember.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>TRACKING</div>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentMember.name}</div>
                    </div>
                </div>

                {/* Center Column - Perfectly Centered */}
                <div style={{ textAlign: 'center', flex: 1.2 }}>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-text-primary)', lineHeight: 1 }}>
                        {timeStr}
                    </div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: isSessionActive ? sessionColor : 'var(--color-accent)', fontWeight: '700', marginTop: '2px' }}>
                        {dateStr}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', position: 'relative' }}>
                    {/* Session Toggle */}
                    <div style={{ position: 'relative' }} ref={pickerRef}>
                        <button
                            onClick={handleSessionClick}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: isSessionActive ? sessionColor : 'var(--color-card-bg)',
                                border: `1px solid ${isSessionActive ? 'transparent' : 'var(--color-card-border)'}`,
                                padding: '6px 10px',
                                borderRadius: '20px',
                                color: isSessionActive ? '#fff' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Briefcase size={14} />
                            <span style={{ display: 'none', lg: 'inline' }}>{isSessionActive ? sessionLabel : 'Session'}</span>
                        </button>

                        {/* Session Type Picker Dropdown */}
                        {showSessionPicker && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                background: 'var(--color-card-bg)', border: '1px solid var(--color-card-border)',
                                borderRadius: '12px', padding: '8px', minWidth: '160px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 200
                            }}>
                                {memberSessions.map(st => (
                                    <button
                                        key={st.id}
                                        onClick={() => handlePickSession(st.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                            width: '100%', padding: '10px 12px', background: 'transparent',
                                            border: 'none', borderRadius: '8px', cursor: 'pointer',
                                            color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: '600',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'var(--color-card-border)'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                                        {st.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sync Status */}
                    <div title={syncStatus === 'synced' ? 'Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Offline'}>
                        {syncStatus === 'syncing' && <Loader size={14} color="#facc15" style={{ animation: 'spin 1s linear infinite' }} />}
                        {syncStatus === 'synced' && <Cloud size={14} color="#4ade80" />}
                        {syncStatus === 'offline' && <CloudOff size={14} color="#ef4444" />}
                    </div>

                    <button
                        onClick={() => isChildLocked ? setShowPinModal(true) : setShowCategorySettings(true)}
                        style={{
                            width: 36, height: 36, borderRadius: '50%', background: 'var(--color-card-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid var(--color-card-border)', cursor: 'pointer',
                            position: 'relative'
                        }}
                    >
                        <Settings size={18} color="var(--color-text-secondary)" />
                        {isChildLocked && (
                            <div style={{
                                position: 'absolute', top: '-2px', right: '-2px',
                                background: '#ef4444', borderRadius: '50%',
                                width: '14px', height: '14px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Lock size={8} color="#fff" />
                            </div>
                        )}
                    </button>
                </div>

                {showCategorySettings && (
                    <CategorySettings onClose={() => setShowCategorySettings(false)} />
                )}

                {showPinModal && (
                    <PinModal
                        correctPin={parentPin}
                        onClose={() => setShowPinModal(false)}
                        onSuccess={() => {
                            setShowPinModal(false);
                            setShowCategorySettings(true);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default TopBar;
