import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Settings, Briefcase, GraduationCap, Zap } from 'lucide-react';
import { format } from 'date-fns';
import CategorySettings from './CategorySettings';

const TopBar = () => {
    const { state, toggleSession } = usePlanner();
    const [showCategorySettings, setShowCategorySettings] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { members, currentMemberId, activeSessions, sessionRequirements } = state;
    const currentMember = members.find(m => m.id === currentMemberId) || members[0];
    const requirement = sessionRequirements[currentMemberId] || { label: currentMemberId === 'me' ? 'Work' : 'School' };

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dateStr = format(currentTime, 'EEE, MMM d');
    const timeStr = format(currentTime, 'hh:mm a');

    const isSessionActive = !!activeSessions[currentMemberId];
    const isParent = currentMemberId === 'me' || currentMember.role === 'admin';
    const sessionLabel = requirement.label + ' Mode';
    const SessionIcon = isParent ? Briefcase : GraduationCap;
    const sessionColor = isParent ? '#3b82f6' : '#8b5cf6'; // Blue for Work, Purple for School

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
                <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                    {/* Session Toggle */}
                    <button
                        onClick={() => toggleSession(currentMemberId)}
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
                        <SessionIcon size={14} />
                        <span style={{ display: 'none', lg: 'inline' }}>{isSessionActive ? 'Active' : sessionLabel}</span>
                    </button>

                    <button
                        onClick={() => setShowCategorySettings(true)}
                        style={{
                            width: 36, height: 36, borderRadius: '50%', background: 'var(--color-card-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid var(--color-card-border)', cursor: 'pointer'
                        }}
                    >
                        <Settings size={18} color="var(--color-text-secondary)" />
                    </button>
                </div>

                {showCategorySettings && (
                    <CategorySettings onClose={() => setShowCategorySettings(false)} />
                )}
            </div>
        </div>
    );
};

export default TopBar;
