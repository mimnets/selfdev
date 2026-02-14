import { formatDuration } from '../utils/theme';
import { differenceInSeconds, parseISO, format } from 'date-fns';
import { usePlanner } from '../context/PlannerContext';
import { CheckCircle2, Circle, Briefcase, GraduationCap } from 'lucide-react';

const ActivityCard = ({ activity, side, onClick }) => {
    const { state, toggleCompleted } = usePlanner();
    const members = state.members || [];
    const currentMember = members.find(m => m.id === activity.memberId) || members[0];
    const theme = state.categories?.[activity.category] || state.categories?.['improving'] || { color: '#666', label: activity.category };
    const isRight = side === 'right';

    let durationText = '';
    if (activity.startTime && activity.endTime) {
        const start = parseISO(activity.startTime);
        const end = parseISO(activity.endTime);
        const totalSeconds = differenceInSeconds(end, start);
        if (totalSeconds > 0) {
            durationText = formatDuration(totalSeconds);
        }
    }

    const handleToggle = (e) => {
        e.stopPropagation();
        toggleCompleted(activity.id);
    };

    return (
        <div
            onClick={() => onClick && onClick(activity)}
            style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: isRight ? 'flex-start' : 'flex-end',
                padding: '20px 0',
                cursor: onClick ? 'pointer' : 'default',
                marginTop: '10px'
            }}
        >
            {/* Time Label on the axis */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                transform: 'translateX(-50%)',
                fontSize: '10px',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-bg)',
                padding: '2px 5px',
                zIndex: 10
            }}>
                {format(new Date(activity.startTime), 'hh:mm a')}
            </div>

            {/* Axis Node */}
            <div style={{
                position: 'absolute',
                left: '50%',
                top: '25px',
                transform: 'translateX(-50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: activity.completed ? '#00ff88' : theme.color,
                boxShadow: activity.completed ? `0 0 15px #00ff88` : `0 0 10px ${theme.color}`,
                zIndex: 5,
                transition: 'all 0.3s'
            }}>
                {activity.completed && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '6px',
                        height: '6px',
                        background: 'var(--color-bg)',
                        borderRadius: '50%'
                    }} />
                )}
            </div>

            {/* Card Content */}
            <div style={{
                width: '42%',
                background: activity.completed ? 'var(--color-accent)0d' : 'var(--color-card-bg)',
                border: `1px solid ${activity.completed ? 'var(--color-accent)' : theme.color}33`,
                borderRadius: '16px',
                padding: '12px',
                marginLeft: isRight ? '20px' : 0,
                marginRight: isRight ? 0 : '20px',
                boxShadow: `0 4px 20px var(--color-shadow)`,
                position: 'relative',
                transition: 'all 0.3s',
                opacity: activity.completed ? 0.8 : 1
            }}>
                {(activity.type === 'reminder' || activity.type === 'note') && (
                    <button
                        onClick={handleToggle}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            color: activity.completed ? '#00ff88' : '#444',
                            zIndex: 2,
                            transition: 'color 0.2s'
                        }}
                    >
                        {activity.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: activity.completed ? '#00ff88' : theme.color,
                            textTransform: 'uppercase'
                        }}>
                            {activity.type === 'reminder' ? 'Reminder' : theme.label}
                        </div>
                        {activity.context === 'official' && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '9px',
                                fontWeight: '800',
                                color: currentMember.id === 'me' ? '#3b82f6' : '#8b5cf6',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'uppercase'
                            }}>
                                {currentMember.id === 'me' ? (
                                    <Briefcase size={10} style={{ marginBottom: '1px' }} />
                                ) : (
                                    <GraduationCap size={10} style={{ marginBottom: '1px' }} />
                                )}
                                {currentMember.id === 'me' ? 'Work' : 'School'}
                            </div>
                        )}
                    </div>
                    {durationText && !activity.completed && (
                        <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>
                            {durationText}
                        </div>
                    )}
                </div>
                <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)',
                    marginBottom: '4px',
                    textDecoration: activity.completed ? 'line-through' : 'none',
                    opacity: activity.completed ? 0.6 : 1
                }}>
                    {activity.title}
                </div>
                {activity.description && (
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                        opacity: activity.completed ? 0.5 : 1
                    }}>
                        {activity.description}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityCard;
