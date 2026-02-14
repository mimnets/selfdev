import React, { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Plus, User, Check, Crown, Baby, Shield } from 'lucide-react';

const Circles = ({ onTabChange }) => {
    const { state, addMember, switchMember } = usePlanner();
    const { members, currentMemberId } = state;

    const [showAddModal, setShowAddModal] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('child'); // 'admin', 'partner', 'child'
    const [newMemberColor, setNewMemberColor] = useState('#FF6B6B');

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB'];

    const handleAddMember = () => {
        if (!newMemberName.trim()) return;
        addMember({
            name: newMemberName,
            role: newMemberRole,
            color: newMemberColor,
            createdAt: new Date().toISOString()
        });
        setNewMemberName('');
        setShowAddModal(false);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Crown size={14} color="#FFD700" />;
            case 'child': return <Baby size={14} color="#FFF" />;
            default: return <User size={14} color="#FFF" />;
        }
    };

    return (
        <div style={{ padding: '24px', paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Family Circles</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    style={{
                        background: '#00ff88',
                        color: '#000',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Members Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {members?.map(member => {
                    const isCurrent = member.id === currentMemberId;
                    return (
                        <div
                            key={member.id}
                            onClick={() => {
                                switchMember(member.id);
                                if (onTabChange) onTabChange('timeline');
                            }}
                            style={{
                                background: isCurrent ? '#333' : '#1a1a1a',
                                border: isCurrent ? `2px solid ${member.color || '#00ff88'}` : '2px solid transparent',
                                borderRadius: '16px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: '0.2s',
                                position: 'relative'
                            }}
                        >
                            {isCurrent && (
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    background: member.color || '#00ff88', borderRadius: '50%', padding: '4px'
                                }}>
                                    <Check size={12} color="#000" />
                                </div>
                            )}

                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: member.color || '#666',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '12px',
                                fontSize: '24px', fontWeight: 'bold', color: '#000' // Dark text for contrast on bright colors
                            }}>
                                {member.name.charAt(0).toUpperCase()}
                            </div>

                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>
                                {member.name}
                            </div>

                            <div style={{
                                fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '4px',
                                background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '12px'
                            }}>
                                {getRoleIcon(member.role)}
                                <span>{member.role?.toUpperCase()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#1a1a1a', borderRadius: '24px', width: '90%', maxWidth: '320px', padding: '24px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '20px' }}>Add Family Member</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Name</label>
                            <input
                                autoFocus
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                                style={{
                                    width: '100%', background: '#333', border: 'none', borderRadius: '12px',
                                    padding: '12px', color: '#fff', fontSize: '16px', outline: 'none'
                                }}
                                placeholder="e.g. Alex"
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Role</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['child', 'partner', 'admin'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setNewMemberRole(r)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: newMemberRole === r ? '#00ff88' : '#333',
                                            color: newMemberRole === r ? '#000' : '#888',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {r.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Color Tag</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {colors.map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setNewMemberColor(c)}
                                        style={{
                                            width: '24px', height: '24px', borderRadius: '50%', background: c,
                                            cursor: 'pointer', border: newMemberColor === c ? '2px solid #fff' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddMember}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#00ff88', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Circles;
