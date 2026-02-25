import { useState, useEffect } from 'react';
import { X, Play, Clock, CheckCircle2, Circle } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { CATEGORIES, THEME } from '../utils/theme';
import { categorizeActivity } from '../utils/categorizer';
import { format, parseISO } from 'date-fns';

const AddActivityModal = ({ onClose, initialData = null }) => {
    const { startActivity, addRetroactive, addNote, addReminder, learnRule, updateActivity, state } = usePlanner();

    // Determine initial mode based on initialData type or default to 'live'
    const getInitialMode = () => {
        if (!initialData) return 'live';
        if (initialData.type === 'note') return 'note';
        if (initialData.type === 'reminder') return 'reminder';
        if (initialData.isGap) return 'retro';
        return 'retro';
    };

    const [mode, setMode] = useState(getInitialMode());
    const [title, setTitle] = useState(initialData?.isGap ? '' : (initialData?.title || ''));
    const [category, setCategory] = useState(initialData?.category || CATEGORIES.GOOD);
    const [description, setDescription] = useState(initialData?.isGap ? '' : (initialData?.description || ''));
    const [completed, setCompleted] = useState(initialData?.completed || false);

    // Auto-cat state
    const [autoDetected, setAutoDetected] = useState(false);
    const [showCategoryList, setShowCategoryList] = useState(false);

    // Retro fields
    // Ensure we have valid dates if editing
    // Use format from date-fns to get local time string for the input
    const formatForInput = (isoString) => isoString ? format(parseISO(isoString), "yyyy-MM-dd'T'HH:mm") : '';

    const [startTime, setStartTime] = useState(initialData?.startTime ? formatForInput(initialData.startTime) : '');
    const [endTime, setEndTime] = useState(initialData?.endTime ? formatForInput(initialData.endTime) : '');

    useEffect(() => {
        // Auto-categorize when title or description changes
        if (title.length > 2) {
            const detected = categorizeActivity(`${title} ${description}`, state.customRules, state.categories);
            if (detected && detected !== category) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setCategory(detected);
                setAutoDetected(true);
            }
        }
    }, [title, description, state.customRules, state.categories, category]);

    const handleCategorySelect = (cat) => {
        setCategory(cat);
        setAutoDetected(false); // User manually selected, override auto

        // If title exists, learn this manual association
        // Only simple single-word keyword learning for now to avoid noise
        // or just rely on explicit "Learn" button?
        // User requirement: "If the user manually changes a category... app should remember"
        // We'll learn from the first significant word or the whole subject?
        // Let's rely on explicit save for learning to avoid accidental pollution, 
        // OR learn on submit if changed from default.
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Learning Logic
        const currentAuto = categorizeActivity(`${title} ${description}`, state.customRules, state.categories);
        if (currentAuto !== category && title.trim()) {
            learnRule(title.trim(), category);
        }

        if (initialData && !initialData.isGap) {
            // Update Mode (Regular Edit)
            const updates = {
                title,
                category,
                description,
                completed,
                // Only update times if they are relevant to the mode/type
                ...(mode === 'retro' || mode === 'reminder' ? {
                    startTime: startTime ? new Date(startTime).toISOString() : initialData.startTime
                } : {}),
                ...(mode === 'retro' ? {
                    endTime: endTime ? new Date(endTime).toISOString() : initialData.endTime
                } : {})
            };

            updateActivity(initialData.id, updates);
        } else {
            // Create Mode
            if (mode === 'live') {
                startActivity({ title, category, description });
            } else if (mode === 'retro') {
                if (!startTime || !endTime) return alert('Please set times');
                addRetroactive({
                    title,
                    category,
                    description,
                    type: 'activity',
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString()
                });
            } else if (mode === 'note') {
                addNote({ title, description, category: CATEGORIES.NOTE });
            } else if (mode === 'reminder') {
                if (!startTime) return alert('Please set time for reminder');
                addReminder({
                    title,
                    description,
                    startTime: new Date(startTime).toISOString(),
                    category: CATEGORIES.REMINDER,
                    completed: completed
                });
            }
        }
        onClose();
    };

    const getModeLabel = (m) => {
        switch (m) {
            case 'live': return 'Live';
            case 'retro': return 'Past';
            case 'note': return 'Note';
            case 'reminder': return 'Remind';
            default: return m;
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(5px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                width: '100%',
                maxWidth: '480px',
                background: '#1a1a1a',
                borderRadius: '24px 24px 0 0',
                padding: '24px',
                animation: 'slideUp 0.3s ease-out',
                maxHeight: '90vh', // Prevent going off screen
                overflowY: 'auto'  // Allow scrolling if content is tall
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#fff' }}>{initialData ? 'Edit Entry' : 'New Entry'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Mode Switcher */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#111', padding: '4px', borderRadius: '12px', overflowX: 'auto' }}>
                    {['live', 'retro', 'note', 'reminder'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: '8px',
                                background: mode === m ? '#333' : 'transparent',
                                color: mode === m ? '#fff' : '#666',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                                fontWeight: mode === m ? 'bold' : 'normal'
                            }}
                        >
                            {getModeLabel(m)}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder={mode === 'note' ? "Title (optional)" : "What are you doing?"}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required={mode !== 'note'} // Note might just have body
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#222',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '18px',
                            marginBottom: '20px',
                            outline: 'none'
                        }}
                    />

                    {(mode === 'live' || mode === 'retro') && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <label style={{ color: '#888', fontSize: '12px' }}>CATEGORY</label>
                                {autoDetected && <span style={{ color: '#00ff88', fontSize: '10px' }}>✨ Auto-detected</span>}
                            </div>

                            {/* Selected Category Display */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <div style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    background: THEME[category]?.color || '#333',
                                    color: '#000',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {THEME[category]?.label || 'Select Category'}
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setShowCategoryList(prev => !prev);
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#666', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                    Change
                                </button>
                            </div>

                            {/* Hidden List by Default */}
                            {showCategoryList && (
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {Object.values(CATEGORIES).filter(c => c !== CATEGORIES.NOTE && c !== CATEGORIES.REMINDER).map(cat => {
                                        const theme = THEME[cat];
                                        if (!theme) return null;
                                        const isSelected = category === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => handleCategorySelect(cat)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '20px',
                                                    background: isSelected ? theme.color : '#222',
                                                    color: isSelected ? '#000' : '#888',
                                                    border: `1px solid ${isSelected ? theme.color : '#333'}`,
                                                    cursor: 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    transition: 'all 0.2s',
                                                    fontWeight: '600',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                {theme.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'retro' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                            <div style={{ background: '#222', padding: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                                <label style={{ color: '#888', display: 'block', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold' }}>START TIME</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontFamily: 'inherit',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div style={{ background: '#222', padding: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                                <label style={{ color: '#888', display: 'block', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold' }}>END TIME</label>
                                <input
                                    type="datetime-local"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontFamily: 'inherit',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'reminder' && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ background: '#222', padding: '12px', borderRadius: '12px', border: '1px solid #333' }}>
                                <label style={{ color: '#888', display: 'block', fontSize: '11px', marginBottom: '6px', fontWeight: 'bold' }}>REMIND ME AT</label>
                                <input
                                    type="datetime-local"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#fff',
                                        fontSize: '16px',
                                        fontFamily: 'inherit',
                                        outline: 'none'
                                    }}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {(mode === 'reminder' || mode === 'note') && (
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setCompleted(prev => !prev)}
                                style={{
                                    background: completed ? '#00ff88' : '#222',
                                    border: `1px solid ${completed ? '#00ff88' : '#333'}`,
                                    borderRadius: '8px',
                                    padding: '8px 16px',
                                    color: completed ? '#000' : '#888',
                                    fontWeight: 'bold',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                {completed ? 'Done' : 'Mark as Done'}
                            </button>
                        </div>
                    )}

                    <textarea
                        placeholder={mode === 'note' ? "Write your note here..." : "Add notes, remarks..."}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#222',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#ddd',
                            fontSize: '14px',
                            marginBottom: '24px',
                            height: mode === 'note' ? '200px' : '80px',
                            resize: 'none'
                        }}
                    />

                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#fff',
                            color: '#000',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {mode === 'live' && <Play size={20} fill="black" />}
                        {mode === 'retro' && <Clock size={20} />}
                        {initialData ? 'Update Activity' :
                            (mode === 'live' ? 'Start Activity' :
                                mode === 'retro' ? 'Save Record' :
                                    mode === 'note' ? 'Save Note' : 'Set Reminder')}
                    </button>
                </form>

            </div>
        </div>
    );
};

export default AddActivityModal;
