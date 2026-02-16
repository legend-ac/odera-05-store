// hooks/useProducts.ts
import { useState, useEffect } from 'react';

export interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    description?: string;
    category?: string;
    imageUrl?: string;
    stock?: number;
    createdAt?: any;
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/products');

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            setProducts(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching products');
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshProducts = () => {
        fetchProducts();
    };

    return { products, loading, error, refreshProducts };
}

export function useProduct(slug: string) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;

        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/products/${slug}`);

                if (!response.ok) {
                    throw new Error('Product not found');
                }

                const data = await response.json();
                setProduct(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching product');
                console.error('Error fetching product:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [slug]);

    return { product, loading, error };
}
