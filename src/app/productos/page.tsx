'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { Header } from '@/components/Header';

export default function ProductosPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProducts();
    }, [selectedCategory]);

    const loadProducts = async () => {
        try {
            setLoading(true);

            let q = query(
                collection(db, 'products'),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            // Filtrar por categoría si está seleccionada
            if (selectedCategory) {
                q = query(
                    collection(db, 'products'),
                    where('status', '==', 'active'),
                    where('category', '==', selectedCategory),
                    orderBy('createdAt', 'desc'),
                    limit(50)
                );
            }

            const snapshot = await getDocs(q);
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];

            setProducts(productsData);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadProducts();
            return;
        }

        try {
            setLoading(true);

            // Normalizar búsqueda
            const normalized = searchQuery
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim();

            // Buscar usando searchTokens
            const q = query(
                collection(db, 'products'),
                where('status', '==', 'active'),
                where('searchTokens', 'array-contains', normalized),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const productsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];

            setProducts(productsData);
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { value: '', label: 'Todos' },
        { value: 'zapatillas', label: 'Zapatillas' },
        { value: 'ropa', label: 'Ropa' },
        { value: 'mochilas', label: 'Mochilas' },
        { value: 'accesorios', label: 'Accesorios' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header />

            {/* Filters and Search */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Buscar productos..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                                <button
                                    onClick={handleSearch}
                                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition"
                                >
                                    Buscar
                                </button>
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => {
                                        setSelectedCategory(cat.value);
                                        setSearchQuery('');
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${selectedCategory === cat.value
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando productos...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No se encontraron productos
                        </h3>
                        <p className="text-gray-600">
                            Intenta con otra búsqueda o categoría
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <p className="text-gray-600">
                                {products.length} producto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-gray-400 text-sm">
                        © 2026 ODERA 05 STORE. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
