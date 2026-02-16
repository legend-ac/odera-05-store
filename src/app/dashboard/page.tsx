'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
    const { user, isAdmin, loading, signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push('/login');
        }
    }, [user, isAdmin, loading, router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">ODERA 05</h1>
                            <p className="text-sm text-gray-600">Panel de Administración</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        ✅ Dashboard Protegido
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Bienvenido al panel de administración. Esta página está protegida con:
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-2">🔒 Seguridad Enterprise</h3>
                            <ul className="text-sm text-green-800 space-y-1">
                                <li>✅ MFA obligatorio (Google 2FA)</li>
                                <li>✅ Custom Claims verificados</li>
                                <li>✅ Session Lock 8 horas</li>
                                <li>✅ Middleware protección</li>
                            </ul>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">📊 Próximas Features</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>⏸️  Gestión de Productos</li>
                                <li>⏸️  Gestión de Pedidos</li>
                                <li>⏸️  Configuración de Tienda</li>
                                <li>⏸️  Métricas y Reportes</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            <strong>⚠️ Nota:</strong> Tu sesión expirará automáticamente después de 8 horas por seguridad. Tendrás que volver a iniciar sesión.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
