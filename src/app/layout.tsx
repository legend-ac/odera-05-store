// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'ODERA 05 STORE - Tienda Multimarca',
    description: 'Zapatillas, ropa, mochilas y accesorios de las mejores marcas.',
    keywords: ['zapatillas', 'ropa', 'mochilas', 'accesorios', 'Peru', 'Lima'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <AuthProvider>
                    <CartProvider>
                        {children}
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
