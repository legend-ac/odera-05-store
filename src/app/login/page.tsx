'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
    const { user, isAdmin, signIn, loading } = useAuth();
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [loggingIn, setLoggingIn] = useState(false);

    // Redirect si ya está autenticado
    useEffect(() => {
        if (!loading && user && isAdmin) {
            router.push('/dashboard');
        }
    }, [user, isAdmin, loading, router]);

    const handleLogin = async () => {
        setError(null);
        setLoggingIn(true);

        try {
            // 1. Google Sign-In
            await signIn();

            // 2. Obtener ID token
            const idToken = await user?.getIdToken();

            if (!idToken) {
                throw new Error('No se pudo obtener el token');
            }

            // 3. Crear session cookie
            const response = await fetch('/api/session-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Error al crear sesión');
            }

            // 4. Redirect a dashboard
            router.push('/dashboard');

        } catch (error: any) {
            console.error('Login failed:', error);
            setError(error.message || 'Error al iniciar sesión');
            setLoggingIn(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-primary mb-2">ODERA 05</h1>
                    <p className="text-gray-600">Panel de Administración</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-center mb-2">
                                Iniciar Sesión
                            </h2>
                            <p className="text-gray-600 text-center text-sm">
                                Solo administradores autorizados
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Google Sign-In Button */}
                        <button
                            onClick={handleLogin}
                            disabled={loggingIn}
                            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loggingIn ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                                    <span>Iniciando sesión...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    <span>Continuar con Google</span>
                                </>
                            )}
                        </button>

                        {/* Security Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-xs text-blue-800">
                                <strong>🔒 Seguridad Enterprise:</strong> Esta página requiere autenticación de dos factores (2FA) y validación de custom claims. La sesión expira automáticamente después de 8 horas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500">
                    © 2026 ODERA 05 STORE. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
