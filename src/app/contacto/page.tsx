export default function ContactoPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/*Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-primary">ODERA 05</h1>
                            <p className="text-sm text-gray-600">Contacto</p>
                        </div>
                        <a href="/" className="text-gray-700 hover:text-primary transition">
                            Inicio
                        </a>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                        Contáctanos
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* WhatsApp */}
                        <a
                            href="https://wa.me/51916305297"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-50 border-2 border-green-200 rounded-lg p-6 hover:bg-green-100 transition group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl">📱</div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">WhatsApp</h3>
                                    <p className="text-gray-600">Respuesta inmediata</p>
                                </div>
                            </div>
                            <p className="text-green-700 font-semibold group-hover:underline">
                                +51 916 305 297
                            </p>
                        </a>

                        {/* Email */}
                        <a
                            href="mailto:contacto@odera05.com"
                            className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 hover:bg-blue-100 transition group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl">📧</div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Email</h3>
                                    <p className="text-gray-600">Te respondemos en 24h</p>
                                </div>
                            </div>
                            <p className="text-blue-700 font-semibold group-hover:underline">
                                contacto@odera05.com
                            </p>
                        </a>

                        {/* Instagram */}
                        <a
                            href="https://www.instagram.com/paso_urbano_pe/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-pink-50 border-2 border-pink-200 rounded-lg p-6 hover:bg-pink-100 transition group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl">📷</div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Instagram</h3>
                                    <p className="text-gray-600">Síguenos</p>
                                </div>
                            </div>
                            <p className="text-pink-700 font-semibold group-hover:underline">
                                @paso_urbano_pe
                            </p>
                        </a>

                        {/* TikTok */}
                        <a
                            href="https://www.tiktok.com/@pas.urbano"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 hover:bg-purple-100 transition group"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl">🎵</div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">TikTok</h3>
                                    <p className="text-gray-600">Nuestros videos</p>
                                </div>
                            </div>
                            <p className="text-purple-700 font-semibold group-hover:underline">
                                @pas.urbano
                            </p>
                        </a>
                    </div>

                    {/* Info adicional */}
                    <div className="mt-12 bg-gray-50 rounded-lg p-6">
                        <h3 className="font-bold text-gray-900 mb-4">📍 Información de Envío</h3>
                        <div className="space-y-2 text-gray-600">
                            <p><strong>Delivery Lima:</strong> Los Olivos, San Martín de Porres, Independencia, Comas (S/15)</p>
                            <p><strong>Envío Nacional:</strong> Agencia Shalom a todo el Perú</p>
                            <p><strong>Pago:</strong> Yape, Plin o pago en destino</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
