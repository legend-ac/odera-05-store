'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, ProductVariant } from '@/types';

export interface CartItem {
    productId: string;
    productName: string;
    productSlug: string;
    variantId: string;
    variantSize?: string;
    variantColor?: string;
    price: number;
    quantity: number;
    imageUrl: string;
    stock: number;
}

interface CartContextType {
    items: CartItem[];
    itemCount: number;
    subtotal: number;
    addItem: (product: Product, variant: ProductVariant, quantity: number) => void;
    removeItem: (productId: string, variantId: string) => void;
    updateQuantity: (productId: string, variantId: string, quantity: number) => void;
    clearCart: () => void;
    isInCart: (productId: string, variantId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'odera05_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                setItems(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }, [items]);

    const addItem = (product: Product, variant: ProductVariant, quantity: number) => {
        setItems(currentItems => {
            const existingIndex = currentItems.findIndex(
                item => item.productId === product.id && item.variantId === variant.id
            );

            if (existingIndex >= 0) {
                // Update quantity if item already exists
                const updatedItems = [...currentItems];
                updatedItems[existingIndex] = {
                    ...updatedItems[existingIndex],
                    quantity: updatedItems[existingIndex].quantity + quantity,
                };
                return updatedItems;
            } else {
                // Add new item
                const newItem: CartItem = {
                    productId: product.id,
                    productName: product.name,
                    productSlug: product.slug,
                    variantId: variant.id,
                    variantSize: variant.size,
                    variantColor: variant.color,
                    price: product.onSale && product.salePrice ? product.salePrice : product.price,
                    quantity,
                    imageUrl: product.coverImageUrl || '',
                    stock: variant.stock,
                };
                return [...currentItems, newItem];
            }
        });
    };

    const removeItem = (productId: string, variantId: string) => {
        setItems(currentItems =>
            currentItems.filter(
                item => !(item.productId === productId && item.variantId === variantId)
            )
        );
    };

    const updateQuantity = (productId: string, variantId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId, variantId);
            return;
        }

        setItems(currentItems =>
            currentItems.map(item =>
                item.productId === productId && item.variantId === variantId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const isInCart = (productId: string, variantId: string) => {
        return items.some(
            item => item.productId === productId && item.variantId === variantId
        );
    };

    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

    const value: CartContextType = {
        items,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isInCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
