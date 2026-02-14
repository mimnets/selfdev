import { useState } from 'react';
import { useSupabase } from '../context/SupabaseContext';

export const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { signInWithGoogle } = useSupabase();

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError(null);
            await signInWithGoogle();
        } catch (err) {
            setError(err.message);
            console.error('Sign in error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center'
            }}>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Gravity Planner
                </h1>

                <p style={{
                    color: '#666',
                    marginBottom: '32px',
                    fontSize: '14px'
                }}>
                    Track your time, achieve your goals
                </p>

                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px 24px',
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#333',
                        background: 'white',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        transition: 'all 0.2s',
                        opacity: loading ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.target.style.borderColor = '#667eea';
                            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.borderColor = '#ddd';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M19.6 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h5.382a4.6 4.6 0 01-1.996 3.018v2.51h3.232c1.891-1.742 2.982-4.305 2.982-7.35z" fill="#4285F4" />
                        <path d="M10 20c2.7 0 4.964-.895 6.618-2.423l-3.232-2.509c-.895.6-2.04.955-3.386.955-2.605 0-4.81-1.76-5.595-4.123H1.064v2.59A9.996 9.996 0 0010 20z" fill="#34A853" />
                        <path d="M4.405 11.9c-.2-.6-.314-1.24-.314-1.9 0-.66.114-1.3.314-1.9V5.51H1.064A9.996 9.996 0 000 10c0 1.614.386 3.14 1.064 4.49l3.34-2.59z" fill="#FBBC05" />
                        <path d="M10 3.977c1.468 0 2.786.505 3.823 1.496l2.868-2.868C14.959.99 12.695 0 10 0 6.09 0 2.71 2.24 1.064 5.51l3.34 2.59C5.19 5.736 7.395 3.977 10 3.977z" fill="#EA4335" />
                    </svg>
                    {loading ? 'Signing in...' : 'Continue with Google'}
                </button>

                {error && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '8px',
                        color: '#c33',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                <p style={{
                    marginTop: '24px',
                    fontSize: '12px',
                    color: '#999'
                }}>
                    By continuing, you agree to our Terms of Service
                </p>
            </div>
        </div>
    );
};
