// functions/src/orders/createOrder.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { z } from 'zod';

// Inicializar Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// ========== SCHEMAS DE VALIDACIÓN ==========

const DeliverySchema = z.object({
    type: z.literal('DELIVERY'),
    district: z.string().min(1),
    address: z.string().min(5),
    reference: z.string(),
});

const AgencySchema = z.object({
    type: z.literal('AGENCY_COLLECT'),
    department: z.string().min(1),
    province: z.string().min(1),
    district: z.string().min(1),
    dni: z.string().length(8),
    agency: z.literal('Shalom'),
    customerAccepted: z.literal(true),
});

const CreateOrderSchema = z.object({
    customer: z.object({
        name: z.string().min(3),
        phone: z.string().regex(/^9\d{8}$/),
        email: z.string().email().optional(),
    }),
    items: z.array(z.object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().positive(),
    })).min(1),
    shippingType: z.enum(['DELIVERY', 'AGENCY_COLLECT']),
    shippingInfo: z.discriminatedUnion('type', [DeliverySchema, AgencySchema]),
    paymentMethod: z.enum(['yape', 'plin']),
    customerNotes: z.string().optional(),
});

// ========== FUNCIÓN PRINCIPAL ==========

export const createOrder = functions
    .runWith({
        enforceAppCheck: true, // Require valid App Check token
        memory: '512MB',
        timeoutSeconds: 60,
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
            // 1. VALIDAR DATOS
            const validated = CreateOrderSchema.parse(data);

            // 2. CARGAR SETTINGS
            const settingsSnap = await db.doc('settings/store').get();
            if (!settingsSnap.exists) {
                throw new functions.https.HttpsError('not-found', 'Configuración de tienda no encontrada');
            }
            const settings = settingsSnap.data()!;

            // 3. VALIDAR ZONAJE
            if (validated.shippingType === 'DELIVERY') {
                const districts = settings.delivery?.districts || [];
                const districtValid = districts.includes(validated.shippingInfo.district);

                if (!districtValid) {
                    throw new functions.https.HttpsError(
                        'invalid-argument',
                        `Distrito "${validated.shippingInfo.district}" no disponible para delivery. Use envío por agencia.`
                    );
                }
            }

            // 4. TRANSACCIÓN: Validar stock, crear snapshots, reservar, generar código
            const result = await db.runTransaction(async (transaction) => {
                const orderItems: any[] = [];
                let subtotal = 0;

                // 4a. VALIDAR STOCK Y CREAR SNAPSHOTS
                for (const item of validated.items) {
                    const productRef = db.doc(`products/${item.productId}`);
                    const productSnap = await transaction.get(productRef);

                    if (!productSnap.exists) {
                        throw new functions.https.HttpsError(
                            'not-found',
                            `Producto ${item.productId} no encontrado`
                        );
                    }

                    const product = productSnap.data()!;

                    // Verificar activo
                    if (product.status !== 'active') {
                        throw new functions.https.HttpsError(
                            'failed-precondition',
                            `Producto "${product.name}" no está disponible`
                        );
                    }

                    // Encontrar variante
                    const variant = product.variants?.find((v: any) => v.id === item.variantId);
                    if (!variant) {
                        throw new functions.https.HttpsError(
                            'not-found',
                            `Variante no encontrada en producto "${product.name}"`
                        );
                    }

                    // VALIDAR STOCK
                    if (variant.stock < item.quantity) {
                        throw new functions.https.HttpsError(
                            'failed-precondition',
                            `Stock insuficiente para "${product.name}" ${variant.size || variant.color || ''}. Disponible: ${variant.stock}`
                        );
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
                const currentSeq = counterSnap.exists ? (counterSnap.data()!.seq || 0) : 0;
                const newSeq = currentSeq + 1;
                const publicCode = `OD-${newSeq}`;

                transaction.set(counterRef, { seq: newSeq }, { merge: true });

                // 4d. RESERVAR STOCK
                for (const item of validated.items) {
                    const productRef = db.doc(`products/${item.productId}`);
                    const productSnap = await transaction.get(productRef);
                    const product = productSnap.data()!;

                    const updatedVariants = product.variants.map((v: any) =>
                        v.id === item.variantId
                            ? { ...v, stock: v.stock - item.quantity }
                            : v
                    );

                    const newTotalStock = updatedVariants.reduce((sum: number, v: any) => sum + v.stock, 0);

                    transaction.update(productRef, {
                        variants: updatedVariants,
                        totalStock: newTotalStock,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    // STOCK LOG
                    const stockLogRef = db.collection('stockLogs').doc();
                    const variant = product.variants.find((v: any) => v.id === item.variantId);
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

        } catch (error: any) {
            console.error('❌ Error in createOrder:', error);

            if (error instanceof z.ZodError) {
                throw new functions.https.HttpsError('invalid-argument', `Validación fallida: ${error.message}`);
            }
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            throw new functions.https.HttpsError('internal', 'Error interno al crear pedido');
        }
    });
