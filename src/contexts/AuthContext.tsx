'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Verificar si el usuario es admin
    const checkAdminStatus = async (): Promise<boolean> => {
        if (!user) return false;

        try {
            const idTokenResult = await user.getIdTokenResult();
            const isAdminUser = idTokenResult.claims.admin === true;

            // Verificar session lock (max 8 horas)
            const authTime = idTokenResult.claims.auth_time as number;
            const now = Math.floor(Date.now() / 1000);
            const hoursSinceAuth = (now - authTime) / 3600;

            if (hoursSinceAuth > 8) {
                console.warn('⚠️ Session expired (>8 hours)');
                await signOut();
                return false;
            }

            return isAdminUser;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    };

    // Google Sign-In
    const signIn = async () => {
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Verificar que tenga custom claim admin
            const idTokenResult = await user.getIdTokenResult();

            if (!idTokenResult.claims.admin) {
                await firebaseSignOut(auth);
                throw new Error('No tienes permisos de administrador');
            }

            // Verificar session time
            const authTime = idTokenResult.claims.auth_time as number;
            const now = Math.floor(Date.now() / 1000);
            const hoursSinceAuth = (now - authTime) / 3600;

            if (hoursSinceAuth > 8) {
                await firebaseSignOut(auth);
                throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
            }

            console.log('✅ Admin login successful');

        } catch (error: any) {
            console.error('❌ Login error:', error);
            throw error;
        }
    };

    // Sign Out
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setIsAdmin(false);
            console.log('✅ Signed out');
        } catch (error) {
            console.error('❌ Sign out error:', error);
            throw error;
        }
    };

    // Listener de autenticación
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                const adminStatus = await checkAdminStatus();
                setIsAdmin(adminStatus);
            } else {
                setIsAdmin(false);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const value: AuthContextType = {
        user,
        loading,
        isAdmin,
        signIn,
        signOut,
        checkAdminStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
