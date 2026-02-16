'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { formatCurrency } from '@/lib/utils/formatters';

export default function CheckoutPage() {
    const { items, subtotal, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Estado del formulario
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        deliveryMethod: 'DELIVERY' as 'DELIVERY' | 'AGENCY',
        district: '',
        address: '',
        agencyDni: '',
        acceptedAgencyTerms: false
    });

    // Redirigir si el carrito está vacío
    useEffect(() => {
        if (items.length === 0) {
            router.push('/productos');
        }
    }, [items.length, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // LLAMADA "CERO INVERSIÓN" -> Vercel API Route
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                    })),
                    customer: {
                        name: formData.name,
                        phone: formData.phone,
                    },
                    shippingType: formData.deliveryMethod,
                    shippingInfo: formData.deliveryMethod === 'DELIVERY'
                        ? {
                            type: 'DELIVERY',
                            district: formData.district,
                            address: formData.address,
                            reference: '',
                        }
                        : {
                            type: 'AGENCY_COLLECT',
                            department: 'Por definir',
                            province: 'Por definir',
                            district: 'Por definir',
                            dni: formData.agencyDni,
                            agency: 'Shalom' as const,
                            customerAccepted: formData.acceptedAgencyTerms,
                        },
                    paymentMethod: 'yape' as const,
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar el pedido');
            }

            clearCart();
            router.push(`/confirmation?code=${data.order.publicCode}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return null;
    }

    const shippingCost = formData.deliveryMethod === 'DELIVERY' ? 15 : 0;
    const total = subtotal + shippingCost;

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50">
                <div className="container mx-auto px-4 py-10 max-w-5xl">
                    <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Columna Izquierda: Formulario */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-white p-6 rounded-lg border">
                                <h2 className="text-xl font-bold mb-4">Datos de Envío</h2>

                                {error && (
                                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        required
                                        className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />

                                    <input
                                        type="tel"
                                        placeholder="Celular (ej. 912345678)"
                                        required
                                        pattern="9[0-9]{8}"
                                        className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />

                                    {/* Selección de Envío */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <label className={`border-2 p-4 rounded cursor-pointer transition ${formData.deliveryMethod === 'DELIVERY'
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="envio"
                                                checked={formData.deliveryMethod === 'DELIVERY'}
                                                onChange={() => setFormData({ ...formData, deliveryMethod: 'DELIVERY' })}
                                                className="sr-only"
                                            />
                                            <div className="font-medium">Delivery Lima</div>
                                            <div className="text-sm mt-1">S/ 15.00</div>
                                        </label>

                                        <label className={`border-2 p-4 rounded cursor-pointer transition ${formData.deliveryMethod === 'AGENCY'
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="envio"
                                                checked={formData.deliveryMethod === 'AGENCY'}
                                                onChange={() => setFormData({ ...formData, deliveryMethod: 'AGENCY' })}
                                                className="sr-only"
                                            />
                                            <div className="font-medium">Agencia Shalom</div>
                                            <div className="text-sm mt-1">A consultar</div>
                                        </label>
                                    </div>

                                    {/* Campos condicionales */}
                                    {formData.deliveryMethod === 'DELIVERY' ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Distrito (Lima Norte)"
                                                required
                                                className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                                                value={formData.district}
                                                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                            />
                                            <textarea
                                                placeholder="Dirección exacta con referencia"
                                                required
                                                rows={3}
                                                className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </>
                                    ) : (
                                        <div className="bg-blue-50 p-4 rounded border border-blue-200 space-y-4">
                                            <input
                                                type="text"
                                                placeholder="DNI (obligatorio para agencia)"
                                                required
                                                pattern="[0-9]{8}"
                                                className="w-full border border-gray-300 p-3 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                                                value={formData.agencyDni}
                                                onChange={(e) => setFormData({ ...formData, agencyDni: e.target.value })}
                                            />
                                            <label className="flex items-start gap-2 text-sm text-blue-900">
                                                <input
                                                    type="checkbox"
                                                    required
                                                    className="mt-1"
                                                    checked={formData.acceptedAgencyTerms}
                                                    onChange={(e) => setFormData({ ...formData, acceptedAgencyTerms: e.target.checked })}
                                                />
                                                <span>Acepto que el envío a provincia se paga en destino (agencia Shalom).</span>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-black text-white p-4 rounded font-bold text-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                                >
                                    {loading ? 'Procesando...' : 'Confirmar Pedido'}
                                </button>
                            </div>
                        </form>

                        {/* Columna Derecha: Resumen */}
                        <div>
                            <div className="bg-white p-6 rounded-lg border sticky top-24">
                                <h2 className="text-xl font-bold mb-4">Resumen del Pedido</h2>

                                <div className="space-y-3 mb-4">
                                    {items.map((item) => (
                                        <div key={`${item.productId}-${item.variantId}`} className="flex justify-between text-sm">
                                            <div className="flex-1">
                                                <div className="font-medium">{item.productName}</div>
                                                <div className="text-gray-600 text-xs">
                                                    {item.variantSize && `Talla ${item.variantSize}`}
                                                    {item.variantColor && ` - ${item.variantColor}`}
                                                    {` × ${item.quantity}`}
                                                </div>
                                            </div>
                                            <span className="font-medium">
                                                {formatCurrency(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Envío</span>
                                        <span>{shippingCost > 0 ? formatCurrency(shippingCost) : 'A consultar'}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between text-xl font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <div className="mt-6 bg-gray-50 p-4 rounded text-sm text-gray-600">
                                    <p className="font-medium mb-2">💳 Métodos de pago:</p>
                                    <p>• Yape / Plin</p>
                                    <p>• Reserva por 20 minutos</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
