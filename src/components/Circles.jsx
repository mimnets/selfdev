import { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { Plus, User, Check, Crown, Baby, Lock, Pencil, Trash2, X } from 'lucide-react';
import PinModal from './PinModal';

const Circles = ({ onTabChange }) => {
    const { state, addMember, updateMember, deleteMember, switchMember } = usePlanner();
    const { members, currentMemberId, parentPin } = state;

    const [showAddModal, setShowAddModal] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('child');
    const [newMemberColor, setNewMemberColor] = useState('#FF6B6B');
    const [pinTargetMemberId, setPinTargetMemberId] = useState(null);

    // Edit member state
    const [editingMember, setEditingMember] = useState(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('child');
    const [editColor, setEditColor] = useState('#FF6B6B');

    const currentMember = members.find(m => m.id === currentMemberId);
    const isChildLocked = currentMember?.role === 'child' && !!parentPin;
    const canEdit = currentMember?.role === 'admin' || currentMember?.role === 'partner';

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B59B6', '#3498DB', '#00ff88', '#ef4444', '#facc15', '#ec4899'];

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

    const handleMemberClick = (memberId) => {
        if (memberId === currentMemberId) return;
        if (isChildLocked) {
            setPinTargetMemberId(memberId);
        } else {
            switchMember(memberId);
            if (onTabChange) onTabChange('timeline');
        }
    };

    const openEditModal = (member, e) => {
        e.stopPropagation();
        setEditingMember(member);
        setEditName(member.name);
        setEditRole(member.role || 'child');
        setEditColor(member.color || '#FF6B6B');
    };

    const handleSaveEdit = () => {
        if (!editName.trim() || !editingMember) return;
        updateMember(editingMember.id, {
            name: editName.trim(),
            role: editRole,
            color: editColor
        });
        setEditingMember(null);
    };

    const handleDeleteMember = () => {
        if (!editingMember || editingMember.id === 'me') return;
        if (confirm(`Delete ${editingMember.name}? This cannot be undone.`)) {
            deleteMember(editingMember.id);
            setEditingMember(null);
        }
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
                {!isChildLocked && (
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
                )}
            </div>

            {/* Members Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {members?.map(member => {
                    const isCurrent = member.id === currentMemberId;
                    return (
                        <div
                            key={member.id}
                            onClick={() => handleMemberClick(member.id)}
                            style={{
                                background: isCurrent ? '#333' : '#1a1a1a',
                                border: isCurrent ? `2px solid ${member.color || '#00ff88'}` : '2px solid transparent',
                                borderRadius: '16px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: isCurrent ? 'default' : 'pointer',
                                transition: '0.2s',
                                position: 'relative'
                            }}
                        >
                            {/* Top-right badges */}
                            {isCurrent && !canEdit && (
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    background: member.color || '#00ff88', borderRadius: '50%', padding: '4px'
                                }}>
                                    <Check size={12} color="#000" />
                                </div>
                            )}

                            {isCurrent && canEdit && (
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    display: 'flex', gap: '6px', alignItems: 'center'
                                }}>
                                    <div style={{
                                        background: member.color || '#00ff88', borderRadius: '50%', padding: '4px'
                                    }}>
                                        <Check size={12} color="#000" />
                                    </div>
                                </div>
                            )}

                            {/* Edit button for admin/partner */}
                            {canEdit && (
                                <button
                                    onClick={(e) => openEditModal(member, e)}
                                    style={{
                                        position: 'absolute', top: '10px', left: '10px',
                                        background: '#444', border: 'none', borderRadius: '50%',
                                        width: '28px', height: '28px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', opacity: 0.7, transition: '0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                >
                                    <Pencil size={12} color="#fff" />
                                </button>
                            )}

                            {!isCurrent && isChildLocked && (
                                <div style={{
                                    position: 'absolute', top: '10px', right: '10px',
                                    background: '#ef4444', borderRadius: '50%', padding: '4px'
                                }}>
                                    <Lock size={10} color="#fff" />
                                </div>
                            )}

                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%',
                                background: member.color || '#666',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '12px',
                                fontSize: '24px', fontWeight: 'bold', color: '#000'
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

            {/* Edit Member Modal */}
            {editingMember && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    onClick={() => setEditingMember(null)}
                >
                    <div
                        style={{ background: '#1a1a1a', borderRadius: '24px', width: '90%', maxWidth: '320px', padding: '24px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Edit Member</h2>
                            <button
                                onClick={() => setEditingMember(null)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={20} color="#888" />
                            </button>
                        </div>

                        {/* Avatar preview */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: editColor,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '28px', fontWeight: 'bold', color: '#000',
                                border: '3px solid #333'
                            }}>
                                {(editName || '?').charAt(0).toUpperCase()}
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Name</label>
                            <input
                                autoFocus
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={{
                                    width: '100%', background: '#333', border: 'none', borderRadius: '12px',
                                    padding: '12px', color: '#fff', fontSize: '16px', outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Member name"
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ color: '#888', fontSize: '12px', marginBottom: '8px', display: 'block' }}>Role</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['child', 'partner', 'admin'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setEditRole(r)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: editRole === r ? '#00ff88' : '#333',
                                            color: editRole === r ? '#000' : '#888',
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
                                        onClick={() => setEditColor(c)}
                                        style={{
                                            width: '24px', height: '24px', borderRadius: '50%', background: c,
                                            cursor: 'pointer', border: editColor === c ? '2px solid #fff' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            {editingMember.id !== 'me' && (
                                <button
                                    onClick={handleDeleteMember}
                                    style={{
                                        padding: '12px', borderRadius: '12px', border: 'none',
                                        background: '#ef444433', color: '#ef4444', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title="Delete member"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button
                                onClick={() => setEditingMember(null)}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={!editName.trim()}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                                    background: editName.trim() ? '#00ff88' : '#444',
                                    color: editName.trim() ? '#000' : '#888',
                                    fontWeight: 'bold', cursor: editName.trim() ? 'pointer' : 'not-allowed'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PIN Modal for switching members */}
            {pinTargetMemberId && (
                <PinModal
                    correctPin={parentPin}
                    onClose={() => setPinTargetMemberId(null)}
                    onSuccess={() => {
                        switchMember(pinTargetMemberId);
                        setPinTargetMemberId(null);
                        if (onTabChange) onTabChange('timeline');
                    }}
                />
            )}
        </div>
    );
};

export default Circles;
