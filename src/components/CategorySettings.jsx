import React, { useState, useRef } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { X, Plus, Trash2, Edit2, Check, Palette } from 'lucide-react';

const CategorySettings = ({ onClose }) => {
    const { state, addCategory, updateCategory, deleteCategory } = usePlanner();
    const { categories } = state;

    const [editingId, setEditingId] = useState(null);
    const [newCatLabel, setNewCatLabel] = useState('');
    const [newCatColor, setNewCatColor] = useState('#00ff88');
    const [justAddedId, setJustAddedId] = useState(null);
    const formRef = useRef(null);
    const listEndRef = useRef(null);

    const handleSave = () => {
        if (!newCatLabel.trim()) return;

        if (editingId) {
            updateCategory(editingId, { label: newCatLabel, color: newCatColor });
            setEditingId(null);
            setNewCatLabel('');
            setNewCatColor('#00ff88');
        } else {
            const id = newCatLabel.toLowerCase().replace(/\s+/g, '_');
            addCategory(id, { label: newCatLabel, color: newCatColor, icon: 'tag' });
            setNewCatLabel('');
            setNewCatColor('#00ff88');
            setJustAddedId(id);
            // Scroll to the new category and highlight it
            setTimeout(() => {
                listEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            // Clear highlight after 2 seconds
            setTimeout(() => setJustAddedId(null), 2500);
        }
    };

    const handleEdit = (id, cat) => {
        setEditingId(id);
        setNewCatLabel(cat.label);
        setNewCatColor(cat.color);
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const PRESET_COLORS = [
        '#00ff88', '#4ade80', '#facc15', '#60a5fa', '#ef4444',
        '#ff80ab', '#c5cae9', '#b388ff', '#ffff8d', '#68D391',
        '#63B3ED', '#F6AD55', '#A0AEC0', '#F6E05E', '#B794F4'
    ];

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.95)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(10px)', padding: '20px'
        }} onClick={onClose}>
            <div style={{
                background: '#111', borderRadius: '32px', width: '100%', maxWidth: '440px',
                padding: '24px', border: '1px solid #333', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Manage Categories</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={24} /></button>
                </div>

                {/* Input Area */}
                <div ref={formRef} style={{ background: '#1a1a1a', padding: '20px', borderRadius: '20px', marginBottom: '24px', border: '1px solid #222' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Category Name</label>
                        <input
                            value={newCatLabel}
                            onChange={(e) => setNewCatLabel(e.target.value)}
                            placeholder="e.g. Deep Work"
                            style={{ width: '100%', background: '#222', border: '1px solid #333', borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', outline: 'none' }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Color</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setNewCatColor(c)}
                                    style={{
                                        height: '32px', borderRadius: '8px', background: c, border: `3px solid ${newCatColor === c ? '#fff' : 'transparent'}`,
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '14px', background: '#fff', color: '#000',
                            border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}
                    >
                        {editingId ? <Check size={18} /> : <Plus size={18} />}
                        {editingId ? 'Update Category' : 'Add Category'}
                    </button>
                    {editingId && (
                        <button
                            onClick={() => { setEditingId(null); setNewCatLabel(''); }}
                            style={{ width: '100%', marginTop: '8px', background: 'transparent', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer' }}
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>

                {/* List Area */}
                <div style={{ display: 'grid', gap: '12px', paddingBottom: '24px' }}>
                    {Object.entries(categories).map(([id, cat]) => (
                        <div key={id} ref={id === justAddedId ? listEndRef : null} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: id === justAddedId ? `${cat.color}22` : 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            border: id === justAddedId ? `1px solid ${cat.color}` : '1px solid #222',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color, boxShadow: `0 0 10px ${cat.color}` }} />
                                <span style={{ color: '#fff', fontWeight: '500' }}>{cat.label}</span>
                                {id === justAddedId && (
                                    <span style={{ fontSize: '10px', color: cat.color, fontWeight: 'bold' }}>Added!</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => handleEdit(id, cat)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                {id !== 'nothing' && id !== 'note' && id !== 'reminder' && (
                                    <button onClick={() => { if (window.confirm(`Delete ${cat.label}?`)) deleteCategory(id); }} style={{ background: 'none', border: 'none', color: '#ff444433', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategorySettings;
