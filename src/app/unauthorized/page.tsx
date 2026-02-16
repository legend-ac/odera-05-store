export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Acceso No Autorizado
                    </h1>
                    <p className="text-gray-600 mb-6">
                        No tienes permisos de administrador para acceder a esta página.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Si crees que deberías tener acceso, contacta al administrador del sistema.
                    </p>
                    <a
                        href="/"
                        className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition"
                    >
                        Volver al Inicio
                    </a>
                </div>
            </div>
        </div>
    );
}
