import { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { isSameDay, format, parseISO, endOfDay } from 'date-fns';
import { formatDuration } from '../utils/theme';
import { differenceInSeconds } from 'date-fns';
import { X, Clock, AlertTriangle } from 'lucide-react';

const StaleActivityDetector = () => {
    const { state, resolveStaleActivity } = usePlanner();
    const [staleInfo, setStaleInfo] = useState(null); // { memberId, activity }
    const [customEndTime, setCustomEndTime] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Check for stale activities on mount and when currentActivities change
    useEffect(() => {
        if (dismissed) return;

        const now = new Date();
        const currentActivities = state.currentActivities || {};

        for (const [memberId, activity] of Object.entries(currentActivities)) {
            if (!activity) continue;
            const startTime = new Date(activity.startTime);

            // If activity started on a different day than today, it's stale
            if (!isSameDay(startTime, now)) {
                setStaleInfo({ memberId, activity });
                return;
            }
        }

        setStaleInfo(null);
    }, [state.currentActivities, dismissed]);

    if (!staleInfo || dismissed) return null;

    const { memberId, activity } = staleInfo;
    const startDate = new Date(activity.startTime);
    const theme = state.categories?.[activity.category] || { color: '#666', label: activity.category };

    const elapsedSince = differenceInSeconds(new Date(), startDate);

    // End of the day the activity was started
    const midnightEnd = endOfDay(startDate).toISOString();

    const handleEndAtMidnight = () => {
        resolveStaleActivity(memberId, midnightEnd);
        setStaleInfo(null);
    };

    const handleEndNow = () => {
        resolveStaleActivity(memberId, new Date().toISOString());
        setStaleInfo(null);
    };

    const handleCustomEnd = () => {
        if (!customEndTime) return;
        const endTimeISO = new Date(customEndTime).toISOString();
        resolveStaleActivity(memberId, endTimeISO);
        setStaleInfo(null);
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: '#111',
                border: `1px solid ${theme.color}44`,
                borderRadius: '24px',
                padding: '24px',
                animation: 'zoomIn 0.3s ease-out',
                boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 30px ${theme.color}15`
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AlertTriangle size={20} color="#facc15" />
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Forgotten Activity
                        </div>
                    </div>
                    <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '4px' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Activity Info */}
                <div style={{
                    background: '#1a1a1a',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '20px',
                    border: `1px solid ${theme.color}22`
                }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: theme.color, textTransform: 'uppercase', marginBottom: '6px' }}>
                        {theme.label}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                        {activity.title}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                        <span>Started: {format(startDate, 'MMM d, hh:mm a')}</span>
                        <span style={{ color: '#ef4444' }}>Running: {formatDuration(elapsedSince)}</span>
                    </div>
                </div>

                <div style={{ fontSize: '13px', color: '#999', marginBottom: '20px', lineHeight: '1.5' }}>
                    This activity was started on <strong style={{ color: '#fff' }}>{format(startDate, 'EEEE, MMM d')}</strong> and is still running. When did you actually finish?
                </div>

                {/* Quick Actions */}
                {!showCustom ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={handleEndAtMidnight}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '14px',
                                background: '#222',
                                border: '1px solid #333',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Clock size={16} />
                            End at midnight ({format(startDate, 'MMM d')}, 11:59 PM)
                        </button>

                        <button
                            onClick={() => {
                                // Default the custom time to a reasonable guess (e.g. 30 min after start)
                                const defaultEnd = new Date(startDate.getTime() + 30 * 60 * 1000);
                                setCustomEndTime(format(defaultEnd, "yyyy-MM-dd'T'HH:mm"));
                                setShowCustom(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '14px',
                                background: theme.color,
                                border: 'none',
                                color: '#000',
                                fontSize: '14px',
                                fontWeight: '700',
                                cursor: 'pointer'
                            }}
                        >
                            Set exact end time
                        </button>

                        <button
                            onClick={handleEndNow}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '14px',
                                background: 'transparent',
                                border: '1px solid #333',
                                color: '#888',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Just stop it now
                        </button>
                    </div>
                ) : (
                    <div style={{ animation: 'fadeIn 0.2s' }}>
                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>
                            WHEN DID YOU FINISH?
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold', marginBottom: '4px' }}>DATE</div>
                                <input
                                    type="date"
                                    value={customEndTime.split('T')[0] || ''}
                                    onChange={(e) => {
                                        const time = customEndTime.split('T')[1] || '12:00';
                                        setCustomEndTime(`${e.target.value}T${time}`);
                                    }}
                                    style={{
                                        width: '100%', background: '#222', border: '1px solid #333',
                                        borderRadius: '12px', padding: '12px', color: '#fff',
                                        fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', color: '#666', fontWeight: 'bold', marginBottom: '4px' }}>TIME</div>
                                <input
                                    type="time"
                                    value={customEndTime.split('T')[1] || ''}
                                    onChange={(e) => {
                                        const date = customEndTime.split('T')[0] || format(startDate, 'yyyy-MM-dd');
                                        setCustomEndTime(`${date}T${e.target.value}`);
                                    }}
                                    style={{
                                        width: '100%', background: '#222', border: '1px solid #333',
                                        borderRadius: '12px', padding: '12px', color: '#fff',
                                        fontSize: '14px', outline: 'none', boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Quick time presets relative to start */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            {[15, 30, 60, 120].map(mins => {
                                const presetEnd = new Date(startDate.getTime() + mins * 60 * 1000);
                                return (
                                    <button
                                        key={mins}
                                        onClick={() => setCustomEndTime(format(presetEnd, "yyyy-MM-dd'T'HH:mm"))}
                                        style={{
                                            padding: '8px 12px', borderRadius: '10px',
                                            background: '#222', color: '#ccc', border: '1px solid #333',
                                            fontSize: '11px', cursor: 'pointer'
                                        }}
                                    >
                                        +{mins >= 60 ? `${mins / 60}h` : `${mins}m`} after start
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowCustom(false)}
                                style={{
                                    flex: 1, padding: '14px', borderRadius: '14px',
                                    background: '#222', color: '#888', border: 'none',
                                    fontWeight: 'bold', cursor: 'pointer'
                                }}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCustomEnd}
                                style={{
                                    flex: 2, padding: '14px', borderRadius: '14px',
                                    background: theme.color, color: '#000', border: 'none',
                                    fontWeight: '700', cursor: 'pointer'
                                }}
                            >
                                Confirm End Time
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaleActivityDetector;
