import { useState, useRef, useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import { verifyPin } from '../utils/pinHash';

const PinModal = ({ onSuccess, onClose, correctPin }) => {
    const [digits, setDigits] = useState(['', '', '', '']);
    const [error, setError] = useState(false);
    const [checking, setChecking] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        inputRefs[0].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d?$/.test(value)) return;
        if (checking) return;

        const newDigits = [...digits];
        newDigits[index] = value;
        setDigits(newDigits);
        setError(false);

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        // Auto-submit when 4th digit entered
        if (value && index === 3) {
            const pin = newDigits.join('');
            setChecking(true);
            verifyPin(pin, correctPin).then(match => {
                if (match) {
                    onSuccess();
                } else {
                    setError(true);
                    setTimeout(() => {
                        setDigits(['', '', '', '']);
                        setError(false);
                        setChecking(false);
                        inputRefs[0].current?.focus();
                    }, 600);
                }
            });
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#111', borderRadius: '24px', padding: '32px',
                    width: '90%', maxWidth: '320px', textAlign: 'center',
                    animation: error ? 'shake 0.4s ease' : 'none'
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'transparent', border: 'none', cursor: 'pointer', color: '#666'
                    }}
                >
                    <X size={20} />
                </button>

                <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: error ? '#ef444433' : '#00ff8822',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <Lock size={28} color={error ? '#ef4444' : '#00ff88'} />
                </div>

                <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px' }}>
                    Enter Parent PIN
                </h3>
                <p style={{ color: '#888', fontSize: '13px', margin: '0 0 24px' }}>
                    This area is protected by parental controls
                </p>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={inputRefs[i]}
                            type="tel"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            style={{
                                width: '52px', height: '60px',
                                background: '#222',
                                border: `2px solid ${error ? '#ef4444' : digit ? '#00ff88' : '#333'}`,
                                borderRadius: '12px',
                                color: '#fff', fontSize: '24px', fontWeight: 'bold',
                                textAlign: 'center', outline: 'none',
                                transition: 'border-color 0.2s',
                                WebkitTextSecurity: digit ? 'disc' : 'none'
                            }}
                        />
                    ))}
                </div>

                {error && (
                    <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>
                        Wrong PIN. Try again.
                    </p>
                )}

                <style>{`
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        20% { transform: translateX(-10px); }
                        40% { transform: translateX(10px); }
                        60% { transform: translateX(-6px); }
                        80% { transform: translateX(6px); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default PinModal;
