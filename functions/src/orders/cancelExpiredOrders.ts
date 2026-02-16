// functions/src/orders/cancelExpiredOrders.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Scheduler que corre cada 10 minutos
 * Cancela órdenes SCHEDULED cuyo reservedUntil haya expirado
 * Libera el stock automáticamente
 */
export const cancelExpiredOrders = functions.pubsub
    .schedule('every 10 minutes')
    .timeZone('America/Lima')
    .onRun(async (context) => {
        const now = admin.firestore.Timestamp.now();

        console.log(`🕐 Running TTL cleanup at ${new Date().toISOString()}`);

        // Query órdenes expiradas
        const expiredSnapshot = await db.collection('orders')
            .where('status', '==', 'SCHEDULED')
            .where('reservedUntil', '<=', now)
            .get();

        console.log(`Found ${expiredSnapshot.size} expired orders`);

        if (expiredSnapshot.empty) {
            return null;
        }

        // Procesar en lotes de 500 (límite Firestore)
        const batchSize = 500;
        let processed = 0;

        for (let i = 0; i < expiredSnapshot.docs.length; i += batchSize) {
            const batch = db.batch();
            const docs = expiredSnapshot.docs.slice(i, i + batchSize);

            for (const orderDoc of docs) {
                const order = orderDoc.data();

                // 1. Cambiar estado a CANCELLED_EXPIRED
                batch.update(orderDoc.ref, {
                    status: 'CANCELLED_EXPIRED',
                    statusHistory: admin.firestore.FieldValue.arrayUnion({
                        from: 'SCHEDULED',
                        to: 'CANCELLED_EXPIRED',
                        changedBy: 'system_ttl',
                        changedAt: now,
                        reason: 'TTL expired (20 minutes without payment)',
                    }),
                    updatedAt: now,
                });

                // 2. Liberar stock
                for (const item of order.items) {
                    const productRef = db.doc(`products/${item.productId}`);

                    try {
                        const productSnap = await productRef.get();

                        if (!productSnap.exists) {
                            console.warn(`Product ${item.productId} not found, skipping stock restore`);
                            continue;
                        }

                        const product = productSnap.data()!;
                        const updatedVariants = product.variants.map((v: any) =>
                            v.id === item.variantId
                                ? { ...v, stock: v.stock + item.quantity }
                                : v
                        );

                        const newTotalStock = updatedVariants.reduce((sum: number, v: any) => sum + v.stock, 0);

                        batch.update(productRef, {
                            variants: updatedVariants,
                            totalStock: newTotalStock,
                            updatedAt: now,
                        });

                        // Stock log
                        const stockLogRef = db.collection('stockLogs').doc();
                        const variant = product.variants.find((v: any) => v.id === item.variantId);
                        batch.set(stockLogRef, {
                            productId: item.productId,
                            productPublicCode: item.productPublicCode,
                            variantId: item.variantId,
                            previousStock: variant?.stock || 0,
                            newStock: (variant?.stock || 0) + item.quantity,
                            delta: item.quantity,
                            reason: 'order_expired',
                            relatedOrderId: orderDoc.id,
                            createdAt: now,
                        });
                    } catch (error) {
                        console.error(`Error restoring stock for product ${item.productId}:`, error);
                    }
                }

                processed++;
                console.log(`✅ Cancelled order ${order.publicCode}`);
            }

            await batch.commit();
            console.log(`Batch ${Math.floor(i / batchSize) + 1} committed`);
        }

        console.log(`🎯 Successfully cancelled ${processed} expired orders and restored stock`);
        return null;
    });
