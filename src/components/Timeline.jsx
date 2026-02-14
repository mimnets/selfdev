import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import ActivityCard from './ActivityCard';
import AddActivityModal from './AddActivityModal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { isSameDay, format, subDays, addDays, startOfDay, endOfDay, isAfter } from 'date-fns';

const Timeline = () => {
    const { state } = usePlanner();
    const { activities, currentMemberId } = state;

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editingActivity, setEditingActivity] = useState(null);

    const isToday = isSameDay(selectedDate, new Date());

    const relevantActivities = activities.filter(a =>
        a.memberId === currentMemberId &&
        isSameDay(new Date(a.startTime), selectedDate)
    );

    // Function to inject gaps. Activities are assumed to be sorted desc by default via reducer, 
    // but let's ensure sort just in case.
    const getActivitiesWithGaps = () => {
        // Gather all activities for this member that might touch this date
        let allRelevant = activities.filter(a => {
            if (a.memberId !== currentMemberId) return false;
            const start = new Date(a.startTime);
            const end = a.endTime ? new Date(a.endTime) : start;
            return isSameDay(start, selectedDate) || isSameDay(end, selectedDate);
        });

        // Current activity
        if (state.currentActivity && state.currentActivity.memberId === currentMemberId) {
            const liveStart = new Date(state.currentActivity.startTime);
            if (isSameDay(liveStart, selectedDate) || isSameDay(new Date(), selectedDate)) {
                allRelevant.push({
                    ...state.currentActivity,
                    endTime: new Date().toISOString(),
                    isLive: true
                });
            }
        }

        if (allRelevant.length === 0) return [];

        // Global Max End for this date
        const globalMaxEnd = allRelevant.reduce((max, a) => {
            const end = new Date(a.endTime || a.startTime).getTime();
            return end > max ? end : max;
        }, 0);

        // Sort for rendering (Newest Start Time First)
        const sorted = [...allRelevant].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        const withGaps = [];

        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];

            // 1. Initial Gap (Time since last activity)
            if (i === 0 && !state.currentActivity && isToday) {
                const now = new Date();
                if (now.getTime() - globalMaxEnd > 60000) {
                    withGaps.push({
                        id: `gap-now-global`,
                        title: 'Doing Nothing',
                        category: 'nothing',
                        description: 'Unrecorded time since last activity',
                        startTime: new Date(globalMaxEnd).toISOString(),
                        endTime: now.toISOString(),
                        isGap: true
                    });
                }
            }

            withGaps.push(current);

            // 2. Interval Gap (Between activities)
            if (i < sorted.length - 1) {
                const older = sorted[i + 1];
                const olderEnd = new Date(older.endTime || older.startTime).getTime();
                const currentStart = new Date(current.startTime).getTime();

                if (currentStart - olderEnd > 60000) {
                    // Check if this specific interval is covered by ANY activity's extent
                    const isCovered = allRelevant.some(a => {
                        const aStart = new Date(a.startTime).getTime();
                        const aEnd = new Date(a.endTime || a.startTime).getTime();
                        // Overlap check: Activity 'a' must span the gap between olderEnd and currentStart
                        // We use a 10s grace period for rounding
                        return aStart <= (olderEnd + 10000) && aEnd >= (currentStart - 10000);
                    });

                    if (!isCovered) {
                        withGaps.push({
                            id: `gap-${older.id}-${current.id}`,
                            title: 'Doing Nothing',
                            category: 'nothing',
                            description: 'Unrecorded gap detected',
                            startTime: new Date(olderEnd).toISOString(),
                            endTime: current.startTime,
                            isGap: true
                        });
                    }
                }
            }
        }

        return withGaps;
    };

    const activitiesWithGaps = getActivitiesWithGaps();

    const handlePrev = () => setSelectedDate(prev => subDays(prev, 1));
    const handleNext = () => {
        const next = addDays(selectedDate, 1);
        if (!isAfter(next, new Date())) {
            setSelectedDate(next);
        }
    };
    const goToToday = () => setSelectedDate(new Date());

    return (
        <div style={{ position: 'relative', width: '100%', paddingBottom: '40px' }}>
            {/* Date Navigator */}
            <div style={{
                position: 'sticky',
                top: '0',
                zIndex: 50,
                background: 'var(--color-bg)',
                backdropFilter: 'blur(8px)',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--color-card-border)'
            }}>
                <button onClick={handlePrev} style={navButtonStyle}>
                    <ChevronLeft size={20} />
                </button>

                <div
                    onClick={goToToday}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        color: isToday ? 'var(--color-accent)' : 'var(--color-text-primary)'
                    }}
                >
                    <CalendarIcon size={16} />
                    <span style={{ fontWeight: '700', fontSize: '15px' }}>
                        {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
                    </span>
                </div>

                <button
                    onClick={handleNext}
                    style={{ ...navButtonStyle, opacity: isToday ? 0.3 : 1, cursor: isToday ? 'default' : 'pointer' }}
                    disabled={isToday}
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Central Line */}
            <div className="timeline-line" style={{
                position: 'absolute',
                top: '60px',
                bottom: 0,
                left: '50%',
                width: '2px',
                backgroundColor: 'var(--color-card-border)',
                transform: 'translateX(-50%)',
                zIndex: 0
            }} />

            <div style={{ padding: '20px 0' }}>
                {activitiesWithGaps.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '100px 40px', color: 'var(--color-text-secondary)' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <CalendarIcon size={48} opacity={0.2} style={{ margin: '0 auto' }} />
                        </div>
                        <p>No activities found for this date.</p>
                        {!isToday && (
                            <button onClick={goToToday} style={{
                                background: 'transparent', border: '1px solid var(--color-card-border)', color: 'var(--color-accent)',
                                marginTop: '12px', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer'
                            }}>
                                Back to Today
                            </button>
                        )}
                    </div>
                ) : (
                    activitiesWithGaps.map((act, index) => (
                        <ActivityCard
                            key={act.id}
                            activity={act}
                            side={index % 2 === 0 ? 'left' : 'right'}
                            onClick={(a) => setEditingActivity(a)}
                        />
                    ))
                )}
            </div>

            {editingActivity && (
                <AddActivityModal
                    initialData={editingActivity}
                    onClose={() => setEditingActivity(null)}
                />
            )}
        </div>
    );
};

const navButtonStyle = {
    background: 'var(--color-card-bg)',
    border: 'none',
    borderRadius: '12px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-primary)',
    cursor: 'pointer'
};

export default Timeline;
