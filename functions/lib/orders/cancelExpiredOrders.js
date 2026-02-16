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
exports.cancelExpiredOrders = void 0;
// functions/src/orders/cancelExpiredOrders.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Scheduler que corre cada 10 minutos
 * Cancela órdenes SCHEDULED cuyo reservedUntil haya expirado
 * Libera el stock automáticamente
 */
exports.cancelExpiredOrders = functions.pubsub
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
                    const product = productSnap.data();
                    const updatedVariants = product.variants.map((v) => v.id === item.variantId
                        ? { ...v, stock: v.stock + item.quantity }
                        : v);
                    const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
                    batch.update(productRef, {
                        variants: updatedVariants,
                        totalStock: newTotalStock,
                        updatedAt: now,
                    });
                    // Stock log
                    const stockLogRef = db.collection('stockLogs').doc();
                    const variant = product.variants.find((v) => v.id === item.variantId);
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
                }
                catch (error) {
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
//# sourceMappingURL=cancelExpiredOrders.js.map