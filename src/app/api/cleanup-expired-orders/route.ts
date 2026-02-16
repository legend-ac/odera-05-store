// API Route: Limpieza automática de pedidos expirados (TTL)
// Llamado por cron-job.org cada 20 minutos
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Inicializar Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
    try {
        // 1. VERIFICAR SECRET (prevent abuse)
        const authHeader = request.headers.get('authorization');
        const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

        if (authHeader !== expectedAuth) {
            console.warn('⚠️ Unauthorized cleanup attempt');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const now = admin.firestore.Timestamp.now();
        const ordersRef = db.collection('orders');

        // 2. BUSCAR PEDIDOS EXPIRADOS
        // Status: SCHEDULED (esperando pago)
        // reservedUntil: < ahora (pasaron los 20 minutos)
        const expiredQuery = ordersRef
            .where('status', '==', 'SCHEDULED')
            .where('reservedUntil', '<', now)
            .where('stockReserved', '==', true);

        const snapshot = await expiredQuery.get();

        if (snapshot.empty) {
            console.log('✅ No expired orders found');
            return NextResponse.json({
                success: true,
                processed: 0,
                message: 'No hay pedidos expirados',
            });
        }

        let processedCount = 0;
        const errors: string[] = [];

        // 3. PROCESAR CADA PEDIDO EXPIRADO
        for (const doc of snapshot.docs) {
            try {
                const orderData = doc.data();

                await db.runTransaction(async (transaction) => {
                    // 3a. DEVOLVER STOCK (restaurar inventario)
                    for (const item of orderData.items) {
                        const productRef = db.collection('products').doc(item.productId);
                        const productSnap = await transaction.get(productRef);

                        if (!productSnap.exists) {
                            console.warn(`⚠️ Product ${item.productId} not found`);
                            continue;
                        }

                        const product = productSnap.data()!;

                        // Incrementar stock de la variante
                        const updatedVariants = product.variants.map((v: any) =>
                            v.id === item.variantId
                                ? { ...v, stock: v.stock + item.quantity }
                                : v
                        );

                        // Recalcular total stock
                        const newTotalStock = updatedVariants.reduce(
                            (sum: number, v: any) => sum + v.stock,
                            0
                        );

                        transaction.update(productRef, {
                            variants: updatedVariants,
                            totalStock: newTotalStock,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });

                        console.log(
                            `  ↩️ Restored ${item.quantity}x ${item.nameSnapshot} (${item.variantSnapshot.size})`
                        );
                    }

                    // 3b. CANCELAR ORDEN (marcar como expirada)
                    transaction.update(doc.ref, {
                        status: 'CANCELLED_EXPIRED',
                        stockReserved: false,
                        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
                        cancelledReason: 'TTL expired (20 minutes without payment)',
                        statusHistory: admin.firestore.FieldValue.arrayUnion({
                            from: 'SCHEDULED',
                            to: 'CANCELLED_EXPIRED',
                            changedBy: 'system_cron',
                            changedAt: admin.firestore.Timestamp.now(),
                        }),
                    });
                });

                console.log(`✅ Cleaned order ${orderData.publicCode}`);
                processedCount++;
            } catch (error: any) {
                console.error(`❌ Error processing order ${doc.id}:`, error);
                errors.push(`${doc.id}: ${error.message}`);
            }
        }

        // 4. RESUMEN DE EJECUCIÓN
        const summary = {
            success: true,
            timestamp: now.toDate().toISOString(),
            found: snapshot.size,
            processed: processedCount,
            errors: errors.length > 0 ? errors : undefined,
        };

        console.log(
            `🔄 Cleanup completed: ${processedCount}/${snapshot.size} orders processed`
        );

        return NextResponse.json(summary);
    } catch (error: any) {
        console.error('❌ Cleanup fatal error:', error);

        return NextResponse.json(
            {
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// GET endpoint para testing manual (solo en desarrollo)
export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'GET not allowed in production' },
            { status: 405 }
        );
    }

    // En desarrollo, permitir GET sin auth para testing
    return POST(request);
}
