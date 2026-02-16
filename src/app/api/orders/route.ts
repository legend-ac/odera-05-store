// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function POST(request: Request) {
    try {
        const order = await request.json();

        // Validate required fields
        if (!order.customerInfo || !order.items || order.items.length === 0) {
            return NextResponse.json(
                { error: 'Invalid order data' },
                { status: 400 }
            );
        }

        // Add server timestamp
        const orderData = {
            ...order,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
        };

        const docRef = await adminDb.collection('orders').add(orderData);

        return NextResponse.json({
            id: docRef.id,
            message: 'Order created successfully',
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const ordersSnapshot = await adminDb
            .collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
