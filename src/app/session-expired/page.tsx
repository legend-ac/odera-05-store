'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionExpiredPage() {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleRelogin = async () => {
        await signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-6xl mb-4">⏰</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Sesión Expirada
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Tu sesión ha expirado por seguridad (máximo 8 horas).
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Por favor, vuelve a iniciar sesión para continuar.
                    </p>
                    <button
                        onClick={handleRelogin}
                        className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
                    >
                        Iniciar Sesión Nuevamente
                    </button>
                </div>
            </div>
        </div>
    );
}
