// app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

// GET all products (admin)
export async function GET() {
    try {
        const productsSnapshot = await adminDb
            .collection('products')
            .orderBy('createdAt', 'desc')
            .get();

        const products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}

// POST new product
export async function POST(request: Request) {
    try {
        const product = await request.json();

        // Validate required fields
        if (!product.name || !product.price || !product.slug) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const productData = {
            ...product,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('products').add(productData);

        return NextResponse.json({
            id: docRef.id,
            message: 'Product created successfully',
        });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { error: 'Failed to create product' },
            { status: 500 }
        );
    }
}
