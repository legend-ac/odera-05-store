// ADMIN MVP SEGURO: Cambio de Estado con Audit Logs
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { cookies } from 'next/headers';
import { OrderStatus, ALLOWED_TRANSITIONS, SHOULD_RESTORE_STOCK_ON_CANCEL } from '@/types/order';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const db = admin.firestore();

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar sesión y custom claims
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        let decodedClaims;
        try {
            decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
        } catch (error) {
            return NextResponse.json(
                { error: 'Sesión inválida o expirada' },
                { status: 401 }
            );
        }

        if (!decodedClaims.admin) {
            return NextResponse.json(
                { error: 'Permisos insuficientes' },
                { status: 403 }
            );
        }

        const { orderId, newStatus } = await request.json();

        if (!orderId || !newStatus) {
            return NextResponse.json(
                { error: 'orderId y newStatus son requeridos' },
                { status: 400 }
            );
        }

        // 2. VALIDAR ESTADO con enum type-safe
        if (!Object.values(OrderStatus).includes(newStatus as OrderStatus)) {
            return NextResponse.json(
                { error: `Estado inválido: ${newStatus}` },
                { status: 400 }
            );
        }

        // 2. Lógica de negocio mediante transacción
        await db.runTransaction(async (transaction) => {
            const orderRef = db.collection('orders').doc(orderId);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists) {
                throw new Error('Pedido no encontrado');
            }

            const orderData = orderDoc.data()!;
            const currentStatus = orderData.status as OrderStatus;

            // 🔒 VALIDAR TRANSICIÓN DE ESTADO (State Machine)
            const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus];

            if (!allowedTransitions || !allowedTransitions.includes(newStatus as OrderStatus)) {
                throw new Error(
                    `Transición no permitida: ${currentStatus} → ${newStatus}. ` +
                    `Transiciones válidas: ${allowedTransitions?.join(', ') || 'ninguna (estado final)'}`
                );
            }

            // 🔒 Devolución de stock con política definida
            if (
                newStatus === OrderStatus.CANCELLED_MANUAL &&
                orderData.stockReserved
            ) {
                const shouldRestoreStock = SHOULD_RESTORE_STOCK_ON_CANCEL[currentStatus];

                if (shouldRestoreStock) {
                    // Devolver stock automáticamente
                    for (const item of orderData.items) {
                        const productRef = db.collection('products').doc(item.productId);
                        const productSnap = await transaction.get(productRef);

                        if (!productSnap.exists) continue;

                        const product = productSnap.data()!;

                        const updatedVariants = product.variants.map((v: any) =>
                            v.id === item.variantId
                                ? { ...v, stock: v.stock + item.quantity }
                                : v
                        );

                        const newTotalStock = updatedVariants.reduce(
                            (sum: number, v: any) => sum + v.stock,
                            0
                        );

                        transaction.update(productRef, {
                            variants: updatedVariants,
                            totalStock: newTotalStock,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }

                    // Marcar stock como no reservado
                    transaction.update(orderRef, {
                        stockReserved: false,
                    });
                } else {
                    // Stock NO se devuelve automáticamente
                    // Admin debe revisar manualmente
                    console.warn(
                        `⚠️ Pedido ${orderData.publicCode} cancelado desde ${currentStatus}. ` +
                        `Stock NO devuelto automáticamente. Requiere revisión manual.`
                    );
                }
            }

            // Actualizar orden
            transaction.update(orderRef, {
                status: newStatus,
                statusHistory: admin.firestore.FieldValue.arrayUnion({
                    from: currentStatus,
                    to: newStatus,
                    changedBy: decodedClaims.email || decodedClaims.uid,
                    changedAt: admin.firestore.Timestamp.now(),
                }),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: decodedClaims.email || decodedClaims.uid,
            });

            // 3. Generación de Audit Logs fiables en el servidor
            const logRef = db.collection('auditLogs').doc();
            transaction.set(logRef, {
                entity: 'order',
                entityId: orderId,
                action: 'ORDER_STATUS_CHANGED',
                previousValue: currentStatus,
                newValue: newStatus,
                adminUid: decodedClaims.uid,
                adminEmail: decodedClaims.email || null,
                userAgent: request.headers.get('user-agent') || 'unknown',
                ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('❌ Error updating order status:', error);

        return NextResponse.json(
            { error: error.message || 'Error al actualizar estado' },
            { status: 500 }
        );
    }
}
