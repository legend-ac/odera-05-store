// ARQUITECTURA CERO INVERSIÓN CON SEGURIDAD ENTERPRISE
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { sendOrderConfirmation } from '@/lib/mailer';

// 🔴 CRÍTICO: Forzar Node.js runtime para compatibilidad con firebase-admin
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Inicializar Firebase Admin (solo una vez)
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
        // 1. VALIDACIÓN APP CHECK MANUAL (Admin SDK omite estas reglas por defecto)
        const appCheckToken = request.headers.get('X-Firebase-AppCheck');

        if (process.env.NODE_ENV === 'production') {
            if (!appCheckToken) {
                return NextResponse.json(
                    { error: 'App Check token faltante.' },
                    { status: 401 }
                );
            }

            try {
                await admin.appCheck().verifyToken(appCheckToken);
            } catch (error) {
                return NextResponse.json(
                    { error: 'App Check token inválido.' },
                    { status: 401 }
                );
            }
        }

        const body = await request.json();
        const { items, customer, shippingType, shippingInfo, paymentMethod, idempotencyKey } = body;

        // Validación básica
        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
        }

        if (!customer?.name || !customer?.phone) {
            return NextResponse.json({ error: 'Datos de cliente incompletos' }, { status: 400 });
        }

        if (!idempotencyKey) {
            return NextResponse.json({ error: 'Idempotency key requerida' }, { status: 400 });
        }

        // 2. RATE LIMITING SERVER-SIDE
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const rateLimitKey = `${customer.phone}-${clientIp}`;
        const rateLimitRef = db.collection('rateLimits').doc(rateLimitKey);

        const rateLimitDoc = await rateLimitRef.get();
        const now = Date.now();

        if (rateLimitDoc.exists) {
            const lastRequestAt = rateLimitDoc.data()?.lastRequestAt?.toMillis() || 0;
            const timeSinceLastRequest = now - lastRequestAt;

            // 2 minutos entre pedidos del mismo teléfono/IP
            if (timeSinceLastRequest < 120000) {
                return NextResponse.json(
                    { error: 'Demasiadas peticiones. Espera 2 minutos.' },
                    { status: 429 }
                );
            }
        }

        // 3. TRANSACCIÓN ATÓMICA E IDEMPOTENCIA
        const result = await db.runTransaction(async (transaction) => {
            // 3a. IDEMPOTENCIA: Verificar si ya se procesó
            const idempRef = db.collection('idempotency').doc(idempotencyKey);
            const idempDoc = await transaction.get(idempRef);

            if (idempDoc.exists) {
                const existingData = idempDoc.data();
                return {
                    success: true,
                    alreadyProcessed: true,
                    order: {
                        publicCode: existingData?.publicCode,
                        total: existingData?.total,
                    },
                };
            }

            // 3b. Validar stock y crear snapshots
            const orderItems: any[] = [];
            let subtotal = 0;

            for (const item of items) {
                const productRef = db.doc(`products/${item.productId}`);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists) {
                    throw new Error(`Producto ${item.productId} no encontrado`);
                }

                const product = productSnap.data()!;

                if (product.status !== 'active') {
                    throw new Error(`Producto "${product.name}" no disponible`);
                }

                // Encontrar variante
                const variant = product.variants?.find((v: any) => v.id === item.variantId);
                if (!variant) {
                    throw new Error(`Variante no encontrada en "${product.name}"`);
                }

                // 🔒 VALIDAR STOCK
                if (variant.stock < item.quantity) {
                    throw new Error(
                        `Stock insuficiente para "${product.name}". Disponible: ${variant.stock}`
                    );
                }

                // 🔒 PRECIO REAL DEL SERVIDOR (anti-fraude)
                const unitPrice = product.onSale && product.salePrice
                    ? product.salePrice
                    : product.price;

                // Snapshot inmutable
                orderItems.push({
                    productId: product.id,
                    productPublicCode: product.publicCode || product.id,
                    variantId: variant.id,
                    nameSnapshot: product.name,
                    imageSnapshot: product.coverImageUrl || '',
                    variantSnapshot: {
                        size: variant.size,
                        color: variant.color,
                    },
                    unitPriceSnapshot: unitPrice,
                    quantity: item.quantity,
                });

                subtotal += unitPrice * item.quantity;
            }

            // 3c. Calcular envío
            const shippingCost = shippingType === 'DELIVERY' ? 15 : 0;
            const total = subtotal + shippingCost;

            // 3d. Generar código público
            const counterRef = db.doc('counters/orders');
            const counterSnap = await transaction.get(counterRef);
            const currentSeq = counterSnap.exists ? (counterSnap.data()!.seq || 0) : 0;
            const newSeq = currentSeq + 1;
            const publicCode = `OD-${newSeq}`;

            transaction.set(counterRef, { seq: newSeq }, { merge: true });

            // 3e. Reservar stock (decrementar)
            for (const item of items) {
                const productRef = db.doc(`products/${item.productId}`);
                const productSnap = await transaction.get(productRef);
                const product = productSnap.data()!;

                const updatedVariants = product.variants.map((v: any) =>
                    v.id === item.variantId
                        ? { ...v, stock: v.stock - item.quantity }
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

            // 3f. Crear orden
            const orderRef = db.collection('orders').doc();
            const reservedUntil = new Date();
            reservedUntil.setMinutes(reservedUntil.getMinutes() + 20); // TTL 20 min

            const order = {
                publicCode,
                userId: null,
                customer,
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
                shippingType,
                shippingInfo,
                paymentMethod,
                paymentVerified: false,
                whatsappSent: false,
                emailSent: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            transaction.set(orderRef, order);

            // 3g. Registrar idempotencia
            transaction.set(idempRef, {
                orderId: orderRef.id,
                publicCode,
                total,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // 3h. Actualizar rate limit
            transaction.set(rateLimitRef, {
                lastRequestAt: admin.firestore.FieldValue.serverTimestamp(),
                phone: customer.phone,
                ip: clientIp,
            });

            console.log(`✅ Order ${publicCode} created - Total: S/${total}`);

            return {
                success: true,
                alreadyProcessed: false,
                order: {
                    orderId: orderRef.id,
                    publicCode,
                    total,
                },
            };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('❌ Error creating order:', error);

        return NextResponse.json(
            { error: error.message || 'Error al crear pedido' },
            { status: 500 }
        );
    }
}
