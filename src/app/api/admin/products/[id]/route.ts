// app/api/admin/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

// GET single product
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const productDoc = await adminDb.collection('products').doc(params.id).get();

        if (!productDoc.exists) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            id: productDoc.id,
            ...productDoc.data(),
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

// PUT update product
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const updates = await request.json();

        await adminDb.collection('products').doc(params.id).update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
            message: 'Product updated successfully',
        });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

// DELETE product
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await adminDb.collection('products').doc(params.id).delete();

        return NextResponse.json({
            message: 'Product deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}
