import React, { useState } from 'react';
import { Calendar, BarChart2, Users, Settings, Plus } from 'lucide-react';
import AddActivityModal from './AddActivityModal';

const BottomNav = ({ activeTab, onTabChange }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="bottom-nav" style={{
                position: 'fixed',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '80px',
                background: 'var(--color-bg)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                borderTop: '1px solid var(--color-card-border)',
                zIndex: 100
            }}>
                <NavItem
                    icon={<Calendar size={24} />}
                    label="Timeline"
                    active={activeTab === 'timeline'}
                    onClick={() => onTabChange('timeline')}
                />
                <NavItem
                    icon={<BarChart2 size={24} />}
                    label="Analysis"
                    active={activeTab === 'analysis'}
                    onClick={() => onTabChange('analysis')}
                />

                {/* FAB Container - Takes up space in grid/flex to keep symmetry */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <div style={{ position: 'relative', top: '-40px' }}>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: '#00ff88',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 20px rgba(0, 255, 136, 0.4)',
                                cursor: 'pointer',
                                padding: 0 // Reset padding
                            }}
                        >
                            <Plus size={32} color="#000" strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <NavItem
                    icon={<Users size={24} />}
                    label="Circles"
                    active={activeTab === 'circles'}
                    onClick={() => onTabChange('circles')}
                />
                <NavItem
                    icon={<Settings size={24} />}
                    label="Me"
                    active={activeTab === 'me'}
                    onClick={() => onTabChange('me')}
                />
            </div>

            {isModalOpen && (
                <AddActivityModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <div
        onClick={onClick}
        style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
            cursor: 'pointer',
            height: '100%'
        }}>
        {icon}
        <span style={{ fontSize: '10px', fontWeight: '600' }}>{label}</span>
    </div>
);

export default BottomNav;
