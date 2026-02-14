import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { formatDuration } from '../utils/theme';
import { differenceInSeconds } from 'date-fns';
import AddActivityModal from './AddActivityModal';

const LiveStatus = () => {
    const { state, stopActivity } = usePlanner();
    const { currentActivity } = state;
    const [elapsed, setElapsed] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        let interval;
        if (currentActivity) {
            // Update immediately
            const update = () => {
                const start = new Date(currentActivity.startTime);
                const now = new Date();
                const totalSeconds = differenceInSeconds(now, start);
                setElapsed(totalSeconds);

                // Check Auto-Stop Limit
                import('../utils/categorizer').then(({ getAutoStopLimit }) => {
                    const limit = getAutoStopLimit(currentActivity.category, currentActivity.title);
                    if (limit && totalSeconds >= limit) {
                        // Auto-stop limit reached
                        stopActivity();
                    }
                });
            };
            update();
            interval = setInterval(update, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [currentActivity, stopActivity]);

    if (!currentActivity) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <p>No active session.</p>
                <p style={{ fontSize: '12px' }}>Start an activity to begin tracking.</p>
            </div>
        );
    }

    const theme = state.categories?.[currentActivity.category] || state.categories?.['improving'] || { color: '#666', label: currentActivity.category };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0',
            position: 'relative'
        }}>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '0',
                right: '0',
                height: '1px',
                background: `linear-gradient(90deg, transparent, var(--color-card-border), transparent)`,
                zIndex: 0
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>LIVE</div>

                {/* Pulsing Orb - Click to Edit */}
                <div
                    onClick={() => setIsEditing(true)}
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: theme.color,
                        boxShadow: `0 0 30px ${theme.color}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'pulse 2s infinite',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ width: '50%', height: '50%', background: '#fff', borderRadius: '50%', opacity: 0.8 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div
                        onClick={() => setIsEditing(true)}
                        style={{ fontSize: '14px', fontWeight: 'bold', color: theme.color, textTransform: 'uppercase', cursor: 'pointer' }}
                    >
                        {currentActivity.title || theme.label}
                    </div>
                    <div style={{ fontSize: '24px', fontFamily: 'monospace', color: 'var(--color-text-primary)', textShadow: `0 0 10px ${theme.color}` }}>
                        {formatDuration(elapsed)}
                    </div>
                    <button
                        onClick={stopActivity}
                        style={{
                            marginTop: '8px',
                            background: 'var(--color-card-bg)',
                            border: `1px solid ${theme.color}`,
                            borderRadius: '4px',
                            color: 'var(--color-text-primary)',
                            fontSize: '11px',
                            padding: '4px 12px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            alignSelf: 'flex-start'
                        }}
                    >
                        STOP
                    </button>
                </div>
            </div>

            {isEditing && (
                <AddActivityModal
                    initialData={currentActivity}
                    onClose={() => setIsEditing(false)}
                />
            )}
        </div>
    );
};

export default LiveStatus;
