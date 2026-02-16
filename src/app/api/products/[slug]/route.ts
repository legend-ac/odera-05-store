// app/api/products/[slug]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const productSnapshot = await adminDb
            .collection('products')
            .where('slug', '==', params.slug)
            .limit(1)
            .get();

        if (productSnapshot.empty) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        const product = {
            id: productSnapshot.docs[0].id,
            ...productSnapshot.docs[0].data(),
        };

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}
