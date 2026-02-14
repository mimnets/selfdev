import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Clock, CheckCircle2, Circle, Bell, FileText, Send, ChevronRight } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { categorizeActivity } from '../utils/categorizer';
import { format, parseISO, subMinutes, addMinutes, startOfHour, addHours, differenceInMinutes, isBefore } from 'date-fns';
import { formatDuration } from '../utils/theme';

const AddActivityModal = ({ onClose, initialData = null }) => {
    const { startActivity, addRetroactive, addNote, addReminder, learnRule, updateActivity, state } = usePlanner();
    const inputRef = useRef(null);

    // Initial state
    const getInitialMode = () => {
        if (!initialData) return 'quick'; // 'quick' is the Option 2 starting state
        if (initialData.type === 'note') return 'note';
        if (initialData.type === 'reminder') return 'reminder';
        return 'retro';
    };

    const [mode, setMode] = useState(getInitialMode());
    const [isExpanded, setIsExpanded] = useState(!!initialData); // Expand for extra fields

    // Form fields
    const [title, setTitle] = useState(initialData?.isGap ? '' : (initialData?.title || ''));
    const [category, setCategory] = useState(initialData?.category || 'good');
    const [description, setDescription] = useState(initialData?.isGap ? '' : (initialData?.description || ''));
    const [completed, setCompleted] = useState(initialData?.completed || false);
    const [context, setContext] = useState(initialData?.context || 'personal');
    const [autoDetected, setAutoDetected] = useState(false);
    const [showCategoryList, setShowCategoryList] = useState(false);

    const formatForInput = (isoString) => isoString ? format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm") : '';
    const [startTime, setStartTime] = useState(initialData?.startTime ? formatForInput(initialData.startTime) : '');
    const [endTime, setEndTime] = useState(initialData?.endTime ? formatForInput(initialData.endTime) : '');

    // Duration calculation for retro mode
    const [durationText, setDurationText] = useState('');
    useEffect(() => {
        if (mode === 'retro' && startTime && endTime) {
            try {
                const start = parseISO(startTime);
                const end = parseISO(endTime);
                const diff = differenceInMinutes(end, start);
                if (diff > 0) {
                    setDurationText(formatDuration(diff * 60));
                } else {
                    setDurationText('');
                }
            } catch (e) {
                setDurationText('');
            }
        } else {
            setDurationText('');
        }
    }, [startTime, endTime, mode]);

    const handlePresetTime = (type, minutes, isRemind = false) => {
        const now = new Date();
        let target;
        if (isRemind) {
            target = addMinutes(now, minutes);
        } else {
            target = subMinutes(now, minutes);
        }

        const formatted = format(target, "yyyy-MM-dd'T'HH:mm");
        if (isRemind) {
            setStartTime(formatted);
        } else {
            // End time is Now, Start time is X minutes ago
            setEndTime(format(now, "yyyy-MM-dd'T'HH:mm"));
            setStartTime(formatted);
        }
    };

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    // Auto-cat logic
    useEffect(() => {
        if (title.length > 2) {
            const combinedText = `${title} ${description}`;
            const detected = categorizeActivity(combinedText, state.customRules, state.categories);
            if (detected && detected !== category) {
                setCategory(detected);
                setAutoDetected(true);
            }
        }
    }, [title, description, state.customRules, state.categories]);

    const handleCategorySelect = (cat) => {
        setCategory(cat);
        setAutoDetected(false);
    };

    const handleAction = (m) => {
        if (!title.trim() && m !== 'quick') return alert('Please enter what you are doing first');

        setMode(m);
        // Notes and Live Activities submit instantly in Option 2
        if (m === 'live') {
            submitAction('live');
        } else if (m === 'note') {
            submitAction('note');
        } else {
            // Past and Reminders need more info, expand the form
            setIsExpanded(true);
        }
    };

    const submitAction = (submitMode) => {
        const combinedText = `${title} ${description}`;
        const currentAuto = categorizeActivity(combinedText, state.customRules, state.categories);
        if (currentAuto !== category && title.trim()) {
            learnRule(title.trim(), category);
        }

        if (initialData && !initialData.isGap) {
            const updates = {
                title, category, description, completed, context,
                ...(submitMode === 'retro' || submitMode === 'reminder' ? {
                    startTime: startTime ? new Date(startTime).toISOString() : initialData.startTime
                } : {}),
                ...(submitMode === 'retro' ? {
                    endTime: endTime ? new Date(endTime).toISOString() : initialData.endTime
                } : {})
            };
            updateActivity(initialData.id, updates);
        } else {
            if (submitMode === 'live') {
                startActivity({ title, category, description, context });
            } else if (submitMode === 'retro') {
                if (!startTime || !endTime) return alert('Please set times');
                addRetroactive({
                    title, category, description, type: 'activity', context,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString()
                });
            } else if (submitMode === 'note') {
                addNote({ title, description, category: 'note', context });
            } else if (submitMode === 'reminder') {
                if (!startTime) return alert('Please set time for reminder');
                addReminder({
                    title, description, startTime: new Date(startTime).toISOString(),
                    category: 'reminder', completed: completed, context
                });
            }
        }
        onClose();
    };

    const theme = state.categories?.[category] || state.categories?.['good'] || { color: '#00ff88', label: 'Activity' };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center', // Center for Option 2
            justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                width: '95%',
                maxWidth: '440px',
                background: '#111',
                border: `1px solid ${theme.color}33`,
                borderRadius: '28px',
                padding: '24px',
                animation: 'zoomIn 0.3s ease-out',
                boxShadow: `0 20px 50px rgba(0,0,0,1), 0 0 20px ${theme.color}15`,
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: theme.color, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {initialData ? 'Update Record' : 'Quick Log'}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Main Unified Input */}
                <div style={{ position: 'relative', marginBottom: '24px' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="What are you doing?"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `2px solid ${theme.color}44`,
                            padding: '12px 0',
                            fontSize: '22px',
                            color: '#fff',
                            outline: 'none',
                            transition: 'border-color 0.3s'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleAction('live')}
                    />
                    {autoDetected && (
                        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: theme.color, opacity: 0.8 }}>
                            ✨ {theme.label}
                        </div>
                    )}
                </div>

                {/* Option 2: Quick Action Buttons (Show if not expanded) */}
                {!isExpanded && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <ActionButton
                            icon={<Play size={20} fill="currentColor" />}
                            label="Start"
                            color="#00ff88"
                            onClick={() => handleAction('live')}
                        />
                        <ActionButton
                            icon={<Clock size={20} />}
                            label="Log"
                            color="#60a5fa"
                            onClick={() => handleAction('retro')}
                        />
                        <ActionButton
                            icon={<FileText size={20} />}
                            label="Note"
                            color="#facc15"
                            onClick={() => handleAction('note')}
                        />
                        <ActionButton
                            icon={<Bell size={20} />}
                            label="Alert"
                            color="#B794F4"
                            onClick={() => handleAction('reminder')}
                        />
                    </div>
                )}

                {/* Expanded Sections (Times, Description, etc.) */}
                {isExpanded && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>

                        {(mode === 'live' || mode === 'retro') && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                    {Object.entries(state.categories || {}).filter(([id]) => id !== 'note' && id !== 'reminder').map(([id, cat]) => (
                                        <button
                                            key={id}
                                            onClick={() => handleCategorySelect(id)}
                                            style={{
                                                padding: '6px 14px', borderRadius: '15px',
                                                background: category === id ? cat?.color : '#222',
                                                color: category === id ? '#000' : '#888',
                                                border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {cat?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setContext('personal')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '12px',
                                    background: context === 'personal' ? '#222' : 'transparent',
                                    border: `1px solid ${context === 'personal' ? '#444' : '#222'}`,
                                    color: context === 'personal' ? '#fff' : '#666',
                                    fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                PERSONAL
                            </button>
                            <button
                                onClick={() => setContext('official')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '12px',
                                    background: context === 'official' ? (state.currentMemberId === 'me' ? '#3b82f633' : '#8b5cf633') : 'transparent',
                                    border: `1px solid ${context === 'official' ? (state.currentMemberId === 'me' ? '#3b82f6' : '#8b5cf6') : '#222'}`,
                                    color: context === 'official' ? '#fff' : '#666',
                                    fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                {state.currentMemberId === 'me' ? 'OFFICIAL WORK' : 'SCHOOL SESSION'}
                            </button>
                        </div>

                        <textarea
                            placeholder="Details or remarks..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            style={{
                                width: '100%', padding: '12px', background: '#222', border: 'none', borderRadius: '12px',
                                color: '#ddd', fontSize: '14px', marginBottom: '20px', height: '80px', resize: 'none', outline: 'none'
                            }}
                        />

                        {mode === 'retro' && (
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold' }}>QUICK PRESETS</label>
                                    {durationText && <span style={{ color: theme.color, fontSize: '11px', fontWeight: 'bold' }}>{durationText}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {[15, 30, 60, 120, 240].map(mins => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => handlePresetTime('retro', mins)}
                                            style={{
                                                padding: '8px 12px', borderRadius: '12px',
                                                background: '#222', color: '#ccc', border: '1px solid #333',
                                                fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {mins >= 60 ? `${mins / 60}h ago` : `${mins}m ago`}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            setEndTime(format(now, "yyyy-MM-dd'T'HH:mm"));
                                            setStartTime(format(subMinutes(now, 5), "yyyy-MM-dd'T'HH:mm"));
                                        }}
                                        style={{ padding: '8px 12px', borderRadius: '12px', background: '#222', color: '#ccc', border: '1px solid #333', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        Just now
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                                    <TimeField label="START" value={startTime} onChange={setStartTime} />
                                    <TimeField label="END" value={endTime} onChange={setEndTime} />
                                </div>
                            </div>
                        )}

                        {mode === 'reminder' && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>QUICK PRESETS</label>
                                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {[15, 30, 60, 240, 1440].map(mins => (
                                        <button
                                            key={mins}
                                            type="button"
                                            onClick={() => handlePresetTime('remind', mins, true)}
                                            style={{
                                                padding: '8px 12px', borderRadius: '12px',
                                                background: '#222', color: '#ccc', border: '1px solid #333',
                                                fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {mins === 1440 ? 'Tomorrow' : mins >= 60 ? `+${mins / 60}h` : `+${mins}m`}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const tonight = new Date();
                                            tonight.setHours(20, 0, 0, 0); // 8 PM
                                            setStartTime(format(tonight, "yyyy-MM-dd'T'HH:mm"));
                                        }}
                                        style={{ padding: '8px 12px', borderRadius: '12px', background: '#222', color: '#ccc', border: '1px solid #333', fontSize: '11px', cursor: 'pointer' }}
                                    >
                                        Tonight
                                    </button>
                                </div>
                                <TimeField label="REMIND AT" value={startTime} onChange={setStartTime} fullWidth />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setIsExpanded(false)}
                                style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#222', color: '#888', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Back
                            </button>
                            <button
                                onClick={() => submitAction(mode)}
                                style={{ flex: 2, padding: '14px', borderRadius: '14px', background: '#fff', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {initialData ? 'Update Record' : 'Save Entry'} <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

const ActionButton = ({ icon, label, color, onClick }) => (
    <button
        onClick={onClick}
        style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${color}33`,
            borderRadius: '16px',
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: color,
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.background = `${color}15`;
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.transform = 'translateY(0)';
        }}
    >
        {icon}
        <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#fff' }}>{label}</span>
    </button>
);

const TimeField = ({ label, value, onChange, fullWidth }) => (
    <div style={{ flex: fullWidth ? 'none' : 1, width: fullWidth ? '100%' : 'auto', background: '#222', padding: '10px', borderRadius: '12px' }}>
        <div style={{ fontSize: '9px', color: '#666', fontWeight: 'bold', marginBottom: '4px' }}>{label}</div>
        <input
            type="datetime-local"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', outline: 'none' }}
        />
    </div>
);

export default AddActivityModal;
