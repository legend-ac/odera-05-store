// hooks/useOrders.ts
import { useState } from 'react';

export interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
}

export interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    address?: string;
}

export interface Order {
    id?: string;
    items: OrderItem[];
    customerInfo: CustomerInfo;
    total: number;
    status?: string;
    createdAt?: any;
}

export function useOrders() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createOrder = async (order: Omit<Order, 'id'>): Promise<string | null> => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order),
            });

            if (!response.ok) {
                throw new Error('Failed to create order');
            }

            const data = await response.json();
            return data.id;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error creating order');
            console.error('Error creating order:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async (): Promise<Order[]> => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/orders');

            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching orders');
            console.error('Error fetching orders:', err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { createOrder, fetchOrders, loading, error };
}
