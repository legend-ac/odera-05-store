// functions/src/payments/submitPayment.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

const SubmitPaymentSchema = z.object({
    orderId: z.string(),
    operationCode: z.string().min(4).max(30),
});

/**
 * Registra código de operación de pago
 * Anti-fraude: un código solo puede usarse una vez
 */
export const submitPayment = functions
    .runWith({
        enforceAppCheck: true, // Require valid App Check token
        memory: '256MB',
        timeoutSeconds: 30,
    })
    .https.onCall(async (data, context) => {
        // Verify App Check token
        if (process.env.NODE_ENV === 'production' && !context.app) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'App Check verification failed. Please refresh and try again.'
            );
        }

        try {
            const validated = SubmitPaymentSchema.parse(data);

            // 1. Verificar orden existe
            const orderRef = db.doc(`orders/${validated.orderId}`);
            const orderSnap = await orderRef.get();

            if (!orderSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Orden no encontrada');
            }

            const order = orderSnap.data()!;

            // 2. Verificar estado
            if (order.status === 'CANCELLED_EXPIRED') {
                throw new functions.https.HttpsError(
                    'failed-precondition',
                    'Esta orden expiró. El stock ya fue liberado. Crea un nuevo pedido.'
                );
            }

            if (order.paymentVerified) {
                throw new functions.https.HttpsError(
                    'already-exists',
                    'Este pedido ya fue verificado como pagado'
                );
            }

            // 3. ANTI-FRAUDE: Verificar código único
            const paymentOpRef = db.doc(`paymentOps/${validated.operationCode}`);
            const paymentOpSnap = await paymentOpRef.get();

            if (paymentOpSnap.exists) {
                const existingOp = paymentOpSnap.data();
                throw new functions.https.HttpsError(
                    'already-exists',
                    `Este código de operación ya fue usado en el pedido ${existingOp?.orderPublicCode || 'otro pedido'}`
                );
            }

            // 4. Transacción: registrar código y actualizar orden
            await db.runTransaction(async (transaction) => {
                // Registrar código
                transaction.set(paymentOpRef, {
                    code: validated.operationCode,
                    orderId: validated.orderId,
                    orderPublicCode: order.publicCode,
                    userId: context.auth?.uid || null,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    verified: false,
                });

                // Actualizar orden
                transaction.update(orderRef, {
                    operationCode: validated.operationCode,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Audit log
                const auditRef = db.collection('auditLogs').doc();
                transaction.set(auditRef, {
                    entity: 'order',
                    entityId: validated.orderId,
                    action: 'payment_code_submitted',
                    previousValue: null,
                    newValue: validated.operationCode,
                    performedBy: context.auth?.uid || 'guest',
                    performedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            });

            console.log(`✅ Payment code ${validated.operationCode} submitted for order ${order.publicCode}`);

            return {
                success: true,
                message: 'Código de operación registrado. El administrador verificará tu pago pronto.',
            };

        } catch (error: any) {
            console.error('❌ Error in submitPayment:', error);

            if (error instanceof z.ZodError) {
                throw new functions.https.HttpsError('invalid-argument', error.message);
            }
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            throw new functions.https.HttpsError('internal', 'Error interno');
        }
    });
