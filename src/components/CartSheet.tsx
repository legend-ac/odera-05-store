'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils/formatters';

interface CartSheetProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
    const { items, itemCount, subtotal, updateQuantity, removeItem } = useCart();

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
                {/* Header */}
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                        Carrito ({itemCount})
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🛒</div>
                            <p className="text-gray-600">Tu carrito está vacío</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={`${item.productId}-${item.variantId}`}
                                    className="flex gap-4 bg-gray-50 rounded-lg p-4"
                                >
                                    {/* Image */}
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-white rounded">
                                        {item.imageUrl ? (
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.productName}
                                                fill
                                                className="object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                                                📦
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/productos/${item.productSlug}`}
                                            className="font-medium text-gray-900 hover:text-primary transition line-clamp-2"
                                            onClick={onClose}
                                        >
                                            {item.productName}
                                        </Link>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {item.variantSize && `Talla: ${item.variantSize}`}
                                            {item.variantColor && ` • ${item.variantColor}`}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">
                                            {formatCurrency(item.price)}
                                        </p>

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition"
                                            >
                                                −
                                            </button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                                                disabled={item.quantity >= item.stock}
                                                className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remove button */}
                                    <button
                                        onClick={() => removeItem(item.productId, item.variantId)}
                                        className="text-gray-400 hover:text-red-600 transition flex-shrink-0"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t p-6">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {formatCurrency(subtotal)}
                            </span>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={onClose}
                            className="block w-full bg-primary text-white text-center py-3 rounded-lg font-medium hover:bg-primary/90 transition"
                        >
                            Ir al Checkout
                        </Link>
                        <p className="text-xs text-gray-500 text-center mt-3">
                            Los costos de envío se calcularán en el checkout
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
