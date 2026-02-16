'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { CartSheet } from '@/components/CartSheet';

export function Header() {
    const { itemCount } = useCart();
    const [cartOpen, setCartOpen] = useState(false);

    return (
        <>
            <header className="bg-white shadow-sm border-b sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-primary">ODERA 05</h1>
                        </Link>

                        <nav className="hidden md:flex items-center gap-6">
                            <Link href="/" className="text-gray-700 hover:text-primary transition">
                                Inicio
                            </Link>
                            <Link href="/productos" className="text-gray-700 hover:text-primary transition">
                                Productos
                            </Link>
                            <Link href="/contacto" className="text-gray-700 hover:text-primary transition">
                                Contacto
                            </Link>
                        </nav>

                        {/* Cart Button */}
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative p-2 text-gray-700 hover:text-primary transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <CartSheet isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        </>
    );
}
