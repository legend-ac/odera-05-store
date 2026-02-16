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
exports.createOrder = void 0;
// functions/src/orders/createOrder.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
// Inicializar Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// ========== SCHEMAS DE VALIDACIÓN ==========
const DeliverySchema = zod_1.z.object({
    type: zod_1.z.literal('DELIVERY'),
    district: zod_1.z.string().min(1),
    address: zod_1.z.string().min(5),
    reference: zod_1.z.string(),
});
const AgencySchema = zod_1.z.object({
    type: zod_1.z.literal('AGENCY_COLLECT'),
    department: zod_1.z.string().min(1),
    province: zod_1.z.string().min(1),
    district: zod_1.z.string().min(1),
    dni: zod_1.z.string().length(8),
    agency: zod_1.z.literal('Shalom'),
    customerAccepted: zod_1.z.literal(true),
});
const CreateOrderSchema = zod_1.z.object({
    customer: zod_1.z.object({
        name: zod_1.z.string().min(3),
        phone: zod_1.z.string().regex(/^9\d{8}$/),
        email: zod_1.z.string().email().optional(),
    }),
    items: zod_1.z.array(zod_1.z.object({
        productId: zod_1.z.string(),
        variantId: zod_1.z.string(),
        quantity: zod_1.z.number().int().positive(),
    })).min(1),
    shippingType: zod_1.z.enum(['DELIVERY', 'AGENCY_COLLECT']),
    shippingInfo: zod_1.z.discriminatedUnion('type', [DeliverySchema, AgencySchema]),
    paymentMethod: zod_1.z.enum(['yape', 'plin']),
    customerNotes: zod_1.z.string().optional(),
});
// ========== FUNCIÓN PRINCIPAL ==========
exports.createOrder = functions.https.onCall(async (data, context) => {
    try {
        // 1. VALIDAR DATOS
        const validated = CreateOrderSchema.parse(data);
        // 2. CARGAR SETTINGS
        const settingsSnap = await db.doc('settings/store').get();
        if (!settingsSnap.exists) {
            throw new functions.https.HttpsError('not-found', 'Configuración de tienda no encontrada');
        }
        const settings = settingsSnap.data();
        // 3. VALIDAR ZONAJE
        if (validated.shippingType === 'DELIVERY') {
            const districts = settings.delivery?.districts || [];
            const districtValid = districts.includes(validated.shippingInfo.district);
            if (!districtValid) {
                throw new functions.https.HttpsError('invalid-argument', `Distrito "${validated.shippingInfo.district}" no disponible para delivery. Use envío por agencia.`);
            }
        }
        // 4. TRANSACCIÓN: Validar stock, crear snapshots, reservar, generar código
        const result = await db.runTransaction(async (transaction) => {
            const orderItems = [];
            let subtotal = 0;
            // 4a. VALIDAR STOCK Y CREAR SNAPSHOTS
            for (const item of validated.items) {
                const productRef = db.doc(`products/${item.productId}`);
                const productSnap = await transaction.get(productRef);
                if (!productSnap.exists) {
                    throw new functions.https.HttpsError('not-found', `Producto ${item.productId} no encontrado`);
                }
                const product = productSnap.data();
                // Verificar activo
                if (product.status !== 'active') {
                    throw new functions.https.HttpsError('failed-precondition', `Producto "${product.name}" no está disponible`);
                }
                // Encontrar variante
                const variant = product.variants?.find((v) => v.id === item.variantId);
                if (!variant) {
                    throw new functions.https.HttpsError('not-found', `Variante no encontrada en producto "${product.name}"`);
                }
                // VALIDAR STOCK
                if (variant.stock < item.quantity) {
                    throw new functions.https.HttpsError('failed-precondition', `Stock insuficiente para "${product.name}" ${variant.size || variant.color || ''}. Disponible: ${variant.stock}`);
                }
                // Precio
                const unitPrice = product.onSale && product.salePrice
                    ? product.salePrice
                    : product.price;
                // CREAR SNAPSHOT (inmutable)
                orderItems.push({
                    productId: product.id,
                    productPublicCode: product.publicCode || product.id,
                    variantId: variant.id,
                    nameSnapshot: product.name,
                    imageSnapshot: product.coverImageUrl || (product.images?.[0]?.thumbUrl || ''),
                    variantSnapshot: {
                        size: variant.size,
                        color: variant.color,
                    },
                    unitPriceSnapshot: unitPrice,
                    quantity: item.quantity,
                });
                subtotal += unitPrice * item.quantity;
            }
            // 4b. CALCULAR ENVÍO
            const shippingCost = validated.shippingType === 'DELIVERY'
                ? (settings.delivery?.cost || 15)
                : 0;
            const total = subtotal + shippingCost;
            // 4c. GENERAR CÓDIGO PÚBLICO (OD-XXXX)
            const counterRef = db.doc('counters/orders');
            const counterSnap = await transaction.get(counterRef);
            const currentSeq = counterSnap.exists ? (counterSnap.data().seq || 0) : 0;
            const newSeq = currentSeq + 1;
            const publicCode = `OD-${newSeq}`;
            transaction.set(counterRef, { seq: newSeq }, { merge: true });
            // 4d. RESERVAR STOCK
            for (const item of validated.items) {
                const productRef = db.doc(`products/${item.productId}`);
                const productSnap = await transaction.get(productRef);
                const product = productSnap.data();
                const updatedVariants = product.variants.map((v) => v.id === item.variantId
                    ? { ...v, stock: v.stock - item.quantity }
                    : v);
                const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
                transaction.update(productRef, {
                    variants: updatedVariants,
                    totalStock: newTotalStock,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                // STOCK LOG
                const stockLogRef = db.collection('stockLogs').doc();
                const variant = product.variants.find((v) => v.id === item.variantId);
                transaction.set(stockLogRef, {
                    productId: product.id,
                    productPublicCode: product.publicCode || product.id,
                    variantId: item.variantId,
                    previousStock: variant.stock,
                    newStock: variant.stock - item.quantity,
                    delta: -item.quantity,
                    reason: 'order_created',
                    relatedOrderId: null,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            // 4e. CREAR ORDEN
            const orderRef = db.collection('orders').doc();
            const reservedUntil = new Date();
            reservedUntil.setMinutes(reservedUntil.getMinutes() + 20); // TTL 20 minutos
            const order = {
                publicCode,
                userId: context.auth?.uid || null,
                customer: validated.customer,
                items: orderItems,
                subtotal,
                shippingCost,
                total,
                status: 'SCHEDULED',
                statusHistory: [{
                        from: null,
                        to: 'SCHEDULED',
                        changedBy: 'system',
                        changedAt: admin.firestore.Timestamp.now(),
                    }],
                reservedUntil: admin.firestore.Timestamp.fromDate(reservedUntil),
                stockReserved: true,
                shippingType: validated.shippingType,
                shippingInfo: validated.shippingInfo,
                paymentMethod: validated.paymentMethod,
                paymentVerified: false,
                whatsappSent: false,
                emailSent: false,
                customerNotes: validated.customerNotes || null,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            transaction.set(orderRef, order);
            console.log(`✅ Order ${publicCode} created for total: S/${total.toFixed(2)}`);
            return { orderId: orderRef.id, publicCode, total };
        });
        return {
            success: true,
            order: result,
        };
    }
    catch (error) {
        console.error('❌ Error in createOrder:', error);
        if (error instanceof zod_1.z.ZodError) {
            throw new functions.https.HttpsError('invalid-argument', `Validación fallida: ${error.message}`);
        }
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Error interno al crear pedido');
    }
});
//# sourceMappingURL=createOrder.js.map