import { createContext, useContext, useState, useEffect } from 'react';
import { pb } from '../lib/pocketbase';

const PocketBaseContext = createContext();

export const PocketBaseProvider = ({ children }) => {
    const [user, setUser] = useState(pb.authStore.record);
    const [loading] = useState(false);

    useEffect(() => {
        // Listen for auth changes
        const unsubscribe = pb.authStore.onChange((_token, record) => {
            setUser(record);
        });

        return () => unsubscribe();
    }, []);

    // Google OAuth Sign In (opens popup)
    const signInWithGoogle = async () => {
        const authData = await pb.collection('users').authWithOAuth2({
            provider: 'google',
        });
        return authData;
    };

    // Email/Password Sign Up
    const signUp = async (email, password, metadata = {}) => {
        await pb.collection('users').create({
            email,
            password,
            passwordConfirm: password,
            name: metadata.name || '',
        });
        // Auto-login after signup
        const authData = await pb.collection('users').authWithPassword(email, password);
        return authData;
    };

    // Email/Password Sign In
    const signIn = async (email, password) => {
        const authData = await pb.collection('users').authWithPassword(email, password);
        return authData;
    };

    // Sign Out
    const signOut = async () => {
        pb.authStore.clear();
    };

    const value = {
        user,
        session: pb.authStore.isValid ? { token: pb.authStore.token } : null,
        loading,
        signInWithGoogle,
        signUp,
        signIn,
        signOut,
        pb,
    };

    return (
        <PocketBaseContext.Provider value={value}>
            {children}
        </PocketBaseContext.Provider>
    );
};

// New hook name
export const usePocketBase = () => {
    const context = useContext(PocketBaseContext);
    if (context === undefined) {
        throw new Error('usePocketBase must be used within a PocketBaseProvider');
    }
    return context;
};

// Backward-compatible aliases
export const useSupabase = usePocketBase;
export const SupabaseProvider = PocketBaseProvider;
