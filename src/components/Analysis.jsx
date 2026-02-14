import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import {
    differenceInSeconds, isSameDay, parseISO, format,
    startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    startOfYear, endOfYear, isWithinInterval,
    isToday as dateFnsIsToday, startOfDay, endOfDay,
    addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears
} from 'date-fns';
import {
    Plus, Star, Target, Edit2, Trash2, Download,
    Calendar, ChevronLeft, ChevronRight, BarChart2,
    Briefcase, GraduationCap
} from 'lucide-react';

const Analysis = () => {
    const { state, addGoal, updateGoal, deleteGoal } = usePlanner();
    const { activities, currentMemberId, goals, members, sessionRequirements } = state;
    const currentMember = members.find(m => m.id === currentMemberId) || { name: 'My' };

    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month', 'year'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);

    // Goal Form State
    const [goalTitle, setGoalTitle] = useState('');
    const [goalCategory, setGoalCategory] = useState('education');
    const [goalTarget, setGoalTarget] = useState(30);

    const getInterval = () => {
        switch (viewMode) {
            case 'week': return { start: startOfWeek(selectedDate), end: endOfWeek(selectedDate) };
            case 'month': return { start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) };
            case 'year': return { start: startOfYear(selectedDate), end: endOfYear(selectedDate) };
            default: return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
        }
    };

    const interval = getInterval();

    const getFilteredActivities = () => {
        let base = activities.filter(act => {
            if (act.memberId !== currentMemberId) return false;
            if (act.type === 'note' || act.type === 'reminder') return false;

            const start = parseISO(act.startTime);
            const end = act.endTime ? parseISO(act.endTime) : start;
            // Overlap check: Activity overlaps interval [interval.start, interval.end]
            return (start <= interval.end && end >= interval.start);
        });

        // Include current activity if it matches
        if (state.currentActivity && state.currentActivity.memberId === currentMemberId) {
            const start = parseISO(state.currentActivity.startTime);
            const end = new Date(); // Current live time
            if (start <= interval.end && end >= interval.start) {
                base.push({
                    ...state.currentActivity,
                    endTime: end.toISOString()
                });
            }
        }

        return base.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    };

    const filteredActivities = getFilteredActivities();

    const stats = {};
    let totalSeconds = 0;
    let totalGapSeconds = 0;

    filteredActivities.forEach((act, index) => {
        if (act.endTime) {
            const duration = differenceInSeconds(parseISO(act.endTime), parseISO(act.startTime));
            if (duration > 0) {
                stats[act.category] = (stats[act.category] || 0) + duration;
            }

            if (index < filteredActivities.length - 1) {
                const nextAct = filteredActivities[index + 1];
                if (isSameDay(parseISO(act.endTime), parseISO(nextAct.startTime))) {
                    const gapStart = parseISO(act.endTime).getTime();
                    const gapEnd = parseISO(nextAct.startTime).getTime();
                    const gapDuration = (gapEnd - gapStart) / 1000;

                    if (gapDuration > 60) {
                        // Check if this gap is covered by ANY other activity
                        const isCovered = filteredActivities.some(a => {
                            const aStart = parseISO(a.startTime).getTime();
                            const aEnd = parseISO(a.endTime || a.startTime).getTime();
                            return aStart <= (gapStart + 10000) && aEnd >= (gapEnd - 10000);
                        });

                        if (!isCovered) {
                            totalGapSeconds += gapDuration;
                        }
                    }
                }
            }
        }
    });

    const globalMaxEnd = filteredActivities.reduce((max, a) => {
        const end = parseISO(a.endTime || a.startTime).getTime();
        return end > max ? end : max;
    }, 0);

    if (dateFnsIsToday(selectedDate)) {
        const gapStart = globalMaxEnd;
        const gapEnd = new Date().getTime();
        const currentGap = (gapEnd - gapStart) / 1000;

        if (currentGap > 60) {
            const isCovered = filteredActivities.some(a => {
                const aStart = parseISO(a.startTime).getTime();
                const aEnd = parseISO(a.endTime || a.startTime).getTime();
                return aStart <= (gapStart + 10000) && aEnd >= (gapEnd - 10000);
            });
            if (!isCovered) totalGapSeconds += currentGap;
        }
    }

    if (totalGapSeconds > 0) {
        stats['nothing'] = (stats['nothing'] || 0) + totalGapSeconds;
    }

    let totalOfficialSeconds = 0;
    filteredActivities.forEach(act => {
        if (act.context === 'official' && act.endTime) {
            totalOfficialSeconds += differenceInSeconds(parseISO(act.endTime), parseISO(act.startTime));
        }
    });

    totalSeconds = Object.values(stats).reduce((acc, val) => acc + val, 0);

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const notesCount = activities.filter(act =>
        act.memberId === currentMemberId &&
        act.type === 'note' &&
        act.startTime &&
        isWithinInterval(parseISO(act.startTime), interval)
    ).length;

    const remindersCount = activities.filter(act =>
        act.memberId === currentMemberId &&
        act.type === 'reminder' &&
        act.startTime &&
        isWithinInterval(parseISO(act.startTime), interval)
    ).length;

    const memberGoals = (goals || []).filter(g => g.memberId === currentMemberId);

    const getGoalProgress = (goal) => {
        const duration = stats[goal.category] || 0;
        let scale = 1;
        if (viewMode === 'week') scale = 7;
        else if (viewMode === 'month') scale = 30;
        else if (viewMode === 'year') scale = 365;

        const targetSeconds = (goal.targetValue * scale) * 60;
        const percent = Math.min(100, (duration / targetSeconds) * 100);
        return { duration, percent, completed: duration >= targetSeconds, targetDisplay: goal.targetValue * scale };
    };

    const handleOpenAdd = () => {
        setEditingGoalId(null);
        setGoalTitle('');
        setGoalCategory('education');
        setGoalTarget(30);
        setShowGoalModal(true);
    };

    const handleOpenEdit = (goal) => {
        setEditingGoalId(goal.id);
        setGoalTitle(goal.title);
        setGoalCategory(goal.category);
        setGoalTarget(goal.targetValue);
        setShowGoalModal(true);
    };

    const handleSubmitGoal = () => {
        if (!goalTitle.trim()) return;
        const goalData = {
            memberId: currentMemberId,
            title: goalTitle,
            category: goalCategory,
            targetType: 'duration',
            targetValue: parseInt(goalTarget),
            period: 'daily',
            updatedAt: new Date().toISOString()
        };
        if (editingGoalId) {
            updateGoal(editingGoalId, goalData);
        } else {
            addGoal({ ...goalData, createdAt: new Date().toISOString() });
        }
        setShowGoalModal(false);
    };

    const handlePrev = () => {
        if (viewMode === 'day') setSelectedDate(subDays(selectedDate, 1));
        else if (viewMode === 'week') setSelectedDate(subWeeks(selectedDate, 1));
        else if (viewMode === 'month') setSelectedDate(subMonths(selectedDate, 1));
        else if (viewMode === 'year') setSelectedDate(subYears(selectedDate, 1));
    };

    const handleNext = () => {
        let next;
        if (viewMode === 'day') next = addDays(selectedDate, 1);
        else if (viewMode === 'week') next = addWeeks(selectedDate, 1);
        else if (viewMode === 'month') next = addMonths(selectedDate, 1);
        else if (viewMode === 'year') next = addYears(selectedDate, 1);

        if (next <= new Date()) setSelectedDate(next);
    };

    const getPeriodLabel = () => {
        switch (viewMode) {
            case 'week': return `Week of ${format(interval.start, 'MMM d')}`;
            case 'month': return format(selectedDate, 'MMMM yyyy');
            case 'year': return format(selectedDate, 'yyyy');
            default: return format(selectedDate, 'MMMM d, yyyy');
        }
    };

    const currentTime = new Date();

    return (
        <div style={{ padding: '24px', paddingBottom: '40px', background: 'var(--color-bg)' }}>
            <div className="no-print">
                {/* Sticky Header for Analysis */}
                <div style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    background: 'var(--color-bg)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 0 20px 0',
                    borderBottom: '1px solid var(--color-card-border)'
                }}>
                    {/* Period Selectors */}
                    <div style={{
                        display: 'flex',
                        background: 'var(--color-card-bg)',
                        borderRadius: '16px',
                        padding: '4px',
                        marginBottom: '16px',
                        border: '1px solid var(--color-card-border)'
                    }}>
                        {['day', 'week', 'month', 'year'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: viewMode === mode ? 'var(--color-accent)' : 'transparent',
                                    color: viewMode === mode ? '#000' : 'var(--color-text-secondary)',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Navigation and Title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <button onClick={handlePrev} style={navButtonStyle}><ChevronLeft size={20} /></button>
                            <div style={{ textAlign: 'center' }}>
                                <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--color-text-primary)' }}>{getPeriodLabel()}</h1>
                                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{currentMember.name}'s Analytics</div>
                            </div>
                            <button
                                onClick={handleNext}
                                style={{ ...navButtonStyle, opacity: isWithinInterval(currentTime, interval) ? 0.3 : 1 }}
                                disabled={isWithinInterval(currentTime, interval)}
                            ><ChevronRight size={20} /></button>
                        </div>

                        <button
                            onClick={() => window.print()}
                            style={{
                                background: 'var(--color-card-bg)',
                                border: '1px solid var(--color-card-border)',
                                borderRadius: '12px',
                                padding: '10px 16px',
                                color: 'var(--color-text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            <Download size={18} /> Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="no-print" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                margin: '24px 0'
            }}>
                <div style={cardStyle}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px' }}>TOTAL RECORDED</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{formatDuration(totalSeconds)}</div>
                </div>

                <div style={{ ...cardStyle, borderLeft: `4px solid ${currentMemberId === 'me' ? '#3b82f6' : '#8b5cf6'}`, overflow: 'hidden' }}>
                    <div style={{ fontSize: '11px', color: currentMemberId === 'me' ? '#3b82f6' : '#8b5cf6', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {currentMemberId === 'me' ? <Briefcase size={12} /> : <GraduationCap size={12} />}
                        {(sessionRequirements[currentMemberId]?.label || (currentMemberId === 'me' ? 'Work' : 'School')).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{formatDuration(totalOfficialSeconds)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>/ {sessionRequirements[currentMemberId]?.dailyTarget || 8}h</div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '4px', background: 'var(--color-card-border)', borderRadius: '2px', marginTop: '10px' }}>
                        <div style={{
                            width: `${Math.min(100, (totalOfficialSeconds / ((sessionRequirements[currentMemberId]?.dailyTarget || 8) * 3600)) * 100)}%`,
                            height: '100%',
                            background: currentMemberId === 'me' ? '#3b82f6' : '#8b5cf6',
                            borderRadius: '2px',
                            boxShadow: `0 0 10px ${currentMemberId === 'me' ? '#3b82f666' : '#8b5cf666'}`
                        }} />
                    </div>

                    <div style={{ fontSize: '10px', color: '#555', marginTop: '8px' }}>
                        {totalSeconds > 0 ? Math.round((totalOfficialSeconds / totalSeconds) * 100) : 0}% of your tracked time
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{notesCount}</div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>NOTES</div>
                    </div>
                    <div style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{remindersCount}</div>
                        <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>REMINDERS</div>
                    </div>
                </div>
            </div>

            {/* Breakdown & Goals */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '40px' }}>
                <div>
                    <h3 style={{ fontSize: '16px', color: 'var(--color-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart2 size={18} color="var(--color-accent)" /> Category Breakdown
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {Object.keys(stats).sort((a, b) => stats[b] - stats[a]).map(catKey => {
                            const duration = stats[catKey];
                            const percentage = totalSeconds > 0 ? Math.round((duration / totalSeconds) * 100) : 0;
                            const theme = state.categories?.[catKey] || { color: '#666', label: catKey };

                            return (
                                <div key={catKey} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: 'var(--color-text-primary)', fontSize: '13px', fontWeight: '500' }}>{theme.label}</span>
                                            <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDuration(duration)} ({percentage}%)</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'var(--color-card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percentage}%`, height: '100%', background: theme.color, borderRadius: '3px' }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Target size={18} color="var(--color-accent)" /> Period Goals
                        </h3>
                        <button onClick={handleOpenAdd} style={{ background: 'var(--color-card-bg)', border: `1px solid var(--color-card-border)`, borderRadius: '50%', width: '28px', height: '28px', color: 'var(--color-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={14} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        {memberGoals.length === 0 && (
                            <div style={{ ...cardStyle, color: '#666', fontSize: '13px', textAlign: 'center' }}>No goals set for this period.</div>
                        )}
                        {memberGoals.map(goal => {
                            const { duration, percent, completed, targetDisplay } = getGoalProgress(goal);
                            const theme = state.categories?.[goal.category] || { color: '#666' };

                            return (
                                <div key={goal.id} style={{ ...cardStyle, background: 'var(--color-card-bg)', padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: 'var(--color-text-primary)', fontWeight: '600', fontSize: '14px' }}>{goal.title}</span>
                                            {completed && <Star size={14} color="#00ff88" fill="#00ff88" />}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleOpenEdit(goal)} style={iconButtonStyle}><Edit2 size={12} /></button>
                                            <button onClick={() => { if (window.confirm('Delete goal?')) deleteGoal(goal.id); }} style={{ ...iconButtonStyle, color: '#ff4444' }}><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                                        {formatDuration(duration)} / {targetDisplay}m target
                                    </div>
                                    <div style={{ height: '4px', background: 'var(--color-card-border)', borderRadius: '2px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percent}%`, height: '100%', background: theme.color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* DETAIL TABLE - ONLY FOR DAY VIEW */}
            {viewMode === 'day' && filteredActivities.length > 0 && (
                <div style={{ marginTop: '40px' }} className="no-print">
                    <h3 style={{ fontSize: '16px', color: 'var(--color-text-primary)', marginBottom: '20px' }}>Daily Ledger</h3>
                    <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--color-card-border)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', background: 'var(--color-card-bg)' }}>
                            <thead>
                                <tr style={{ background: '#222', color: '#888' }}>
                                    <th style={tableHeaderStyle}>Time</th>
                                    <th style={tableHeaderStyle}>Activity</th>
                                    <th style={tableHeaderStyle}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActivities.map((act, i) => (
                                    <tr key={act.id} style={{ borderTop: '1px solid #222' }}>
                                        <td style={tableCellStyle}>{format(parseISO(act.startTime), 'hh:mm a')}</td>
                                        <td style={tableCellStyle}>
                                            <div style={{ color: '#fff', fontWeight: '600' }}>{act.title}</div>
                                            <div style={{ color: state.categories[act.category]?.color, fontSize: '10px' }}>{state.categories[act.category]?.label}</div>
                                        </td>
                                        <td style={tableCellStyle}>{act.endTime ? formatDuration(differenceInSeconds(parseISO(act.endTime), parseISO(act.startTime))) : 'Running'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {showGoalModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{ background: '#1a1a1a', borderRadius: '24px', width: '90%', maxWidth: '360px', padding: '24px', border: '1px solid #333' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>
                            {editingGoalId ? 'Edit Goal' : 'Set a Daily Goal'}
                        </h2>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Goal Title</label>
                            <input
                                autoFocus
                                value={goalTitle}
                                onChange={(e) => setGoalTitle(e.target.value)}
                                style={inputStyle}
                                placeholder="e.g. Reading"
                            />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Category</label>
                            <select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)} style={inputStyle}>
                                {Object.entries(state.categories || {}).map(([id, cat]) => (
                                    <option key={id} value={id}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Daily Target (Minutes - will scale with period)</label>
                            <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setShowGoalModal(false)} style={{ ...buttonStyle, background: '#333' }}>Cancel</button>
                            <button onClick={handleSubmitGoal} style={{ ...buttonStyle, background: '#00ff88', color: '#000' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const navButtonStyle = {
    background: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    cursor: 'pointer'
};

const cardStyle = {
    background: 'var(--color-card-bg)',
    borderRadius: '20px',
    padding: '24px',
    border: '1px solid var(--color-card-border)',
    boxShadow: '0 4px 20px var(--color-shadow)'
};

const iconButtonStyle = {
    background: 'var(--color-card-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '6px',
    padding: '6px',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer'
};

const tableHeaderStyle = {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const tableCellStyle = {
    padding: '12px 16px',
    color: '#aaa'
};

const labelStyle = {
    color: '#888',
    fontSize: '11px',
    fontWeight: 'bold',
    marginBottom: '8px',
    display: 'block',
    textTransform: 'uppercase'
};

const inputStyle = {
    width: '100%',
    background: 'var(--color-bg)',
    border: '1px solid var(--color-card-border)',
    borderRadius: '12px',
    padding: '14px',
    color: 'var(--color-text-primary)',
    fontSize: '15px',
    outline: 'none'
};

const buttonStyle = {
    flex: 1,
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    fontWeight: 'bold',
    cursor: 'pointer'
};

export default Analysis;

