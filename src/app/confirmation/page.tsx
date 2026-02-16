'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmationPage() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');

    if (!code) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">No hay pedido que confirmar</h1>
                <Link href="/productos" className="text-blue-600 hover:underline">
                    Volver a la tienda
                </Link>
            </div>
        );
    }

    const message = `Hola ODERA 05 STORE, acabo de realizar el pedido ${code}. Adjunto mi comprobante de Yape/Plin.`;
    const whatsappUrl = `https://wa.me/51916305297?text=${encodeURIComponent(message)}`;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full px-4 py-16 text-center space-y-8">
                {/* Ícono de éxito */}
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-5xl font-bold">
                    ✓
                </div>

                {/* Título */}
                <h1 className="text-4xl font-black uppercase tracking-tight">
                    ¡Pedido Reservado!
                </h1>

                {/* Card con código */}
                <div className="bg-white border-2 border-gray-200 p-8 rounded-2xl inline-block w-full max-w-md mx-auto shadow-lg">
                    <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide">Código de Pedido</p>
                    <p className="text-4xl font-mono font-bold tracking-wider text-black mb-6">
                        {code}
                    </p>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left space-y-3 text-sm">
                        <p className="font-bold text-yellow-900">⏱️ Tienes 20 minutos para confirmar el pago</p>
                        <div className="space-y-2 text-gray-700">
                            <p><strong>1.</strong> Realiza el pago vía Yape o Plin</p>
                            <p className="pl-4">→ <strong>962 266 349</strong> (Andy Cordova)</p>
                            <p><strong>2.</strong> Captura tu comprobante</p>
                            <p><strong>3.</strong> Envíalo por WhatsApp con tu código</p>
                        </div>
                    </div>
                </div>

                {/* Botón WhatsApp */}
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#128C7E] transition shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Enviar Comprobante por WhatsApp
                </a>

                {/* Link volver */}
                <div className="pt-4">
                    <Link
                        href="/productos"
                        className="text-gray-600 hover:text-black underline font-medium"
                    >
                        Seguir comprando
                    </Link>
                </div>
            </div>
        </div>
    );
}
