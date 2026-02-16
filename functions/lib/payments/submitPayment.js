"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitPayment = void 0;
// functions/src/payments/submitPayment.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const db = admin.firestore();
const SubmitPaymentSchema = zod_1.z.object({
    orderId: zod_1.z.string(),
    operationCode: zod_1.z.string().min(4).max(30),
});
/**
 * Registra código de operación de pago
 * Anti-fraude: un código solo puede usarse una vez
 */
exports.submitPayment = functions.https.onCall(async (data, context) => {
    try {
        const validated = SubmitPaymentSchema.parse(data);
        // 1. Verificar orden existe
        const orderRef = db.doc(`orders/${validated.orderId}`);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Orden no encontrada');
        }
        const order = orderSnap.data();
        // 2. Verificar estado
        if (order.status === 'CANCELLED_EXPIRED') {
            throw new functions.https.HttpsError('failed-precondition', 'Esta orden expiró. El stock ya fue liberado. Crea un nuevo pedido.');
        }
        if (order.paymentVerified) {
            throw new functions.https.HttpsError('already-exists', 'Este pedido ya fue verificado como pagado');
        }
        // 3. ANTI-FRAUDE: Verificar código único
        const paymentOpRef = db.doc(`paymentOps/${validated.operationCode}`);
        const paymentOpSnap = await paymentOpRef.get();
        if (paymentOpSnap.exists) {
            const existingOp = paymentOpSnap.data();
            throw new functions.https.HttpsError('already-exists', `Este código de operación ya fue usado en el pedido ${existingOp?.orderPublicCode || 'otro pedido'}`);
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
    }
    catch (error) {
        console.error('❌ Error in submitPayment:', error);
        if (error instanceof zod_1.z.ZodError) {
            throw new functions.https.HttpsError('invalid-argument', error.message);
        }
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Error interno');
    }
});
//# sourceMappingURL=submitPayment.js.map