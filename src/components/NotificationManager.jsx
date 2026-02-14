import React, { useState, useEffect } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Bell, X, Check } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';

const NotificationManager = () => {
    const { state, acknowledgeReminder, toggleCompleted } = usePlanner();
    const { activities, acknowledgedReminders } = state;
    const [activeAlerts, setActiveAlerts] = useState([]);

    useEffect(() => {
        const checkReminders = () => {
            const now = new Date();

            // Find reminders that are due but not yet acknowledged
            const dueReminders = (activities || []).filter(act =>
                act.type === 'reminder' &&
                !acknowledgedReminders.includes(act.id) &&
                (isAfter(now, parseISO(act.startTime)) || now.getTime() === parseISO(act.startTime).getTime())
            );

            if (dueReminders.length > 0) {
                // Add new due reminders to active alerts if they aren't already there
                setActiveAlerts(prev => {
                    const existingIds = prev.map(a => a.id);
                    const newAlerts = dueReminders.filter(r => !existingIds.includes(r.id));
                    return [...prev, ...newAlerts];
                });
            }
        };

        // Poll every 5 seconds
        const interval = setInterval(checkReminders, 5000);
        checkReminders(); // Initial check

        return () => clearInterval(interval);
    }, [activities, acknowledgedReminders]);

    const handleDismiss = (id) => {
        acknowledgeReminder(id);
        setActiveAlerts(prev => prev.filter(a => a.id !== id));
    };

    const handleMarkDone = (id) => {
        const alert = activeAlerts.find(a => a.id === id);
        if (alert && !alert.completed) {
            toggleCompleted(id);
        }
        handleDismiss(id);
    };

    if (activeAlerts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            width: '90%',
            maxWidth: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none' // Let clicks pass through background
        }}>
            {activeAlerts.map(alert => (
                <div
                    key={alert.id}
                    style={{
                        background: '#1a1a1a',
                        border: '1px solid #B794F4', // Reminder color
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'slideInDown 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                        pointerEvents: 'auto' // Allow clicks on the bubble itself
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'rgba(183, 148, 244, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Bell size={20} color="#B794F4" />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#B794F4', fontWeight: 'bold', marginBottom: '2px' }}>
                            REMINDER
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>
                            {alert.title}
                        </div>
                        {alert.description && (
                            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                {alert.description}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => handleDismiss(alert.id)}
                            title="Dismiss"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#888'
                            }}
                        >
                            <X size={18} />
                        </button>
                        <button
                            onClick={() => handleMarkDone(alert.id)}
                            title="Mark as Done"
                            style={{
                                background: '#00ff88',
                                border: 'none',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#000'
                            }}
                        >
                            <Check size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            ))}

            <style>{`
                @keyframes slideInDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default NotificationManager;
