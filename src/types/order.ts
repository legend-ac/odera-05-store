// types/order.ts

/**
 * Estados definidos del pedido en ODERA 05
 * 
 * FLUJO NORMAL:
 * SCHEDULED → PAYMENT_REPORTED → PAYMENT_VERIFIED → PREPARING → 
 * (OUT_FOR_DELIVERY | SHIPPED_AGENCY) → DELIVERED
 * 
 * FLUJOS CANCELACIÓN:
 * SCHEDULED → CANCELLED_EXPIRED (TTL automático)
 * SCHEDULED | PAYMENT_REPORTED | PAYMENT_VERIFIED → CANCELLED_MANUAL (admin)
 */
export enum OrderStatus {
    /** Pedido creado, esperando pago (20 min TTL) */
    SCHEDULED = 'SCHEDULED',

    /** Cliente subió código de operación, esperando verificación admin */
    PAYMENT_REPORTED = 'PAYMENT_REPORTED',

    /** Admin verificó el pago, pedido confirmado */
    PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',

    /** Pedido en preparación/empaque */
    PREPARING = 'PREPARING',

    /** En camino con delivery (Lima Norte) */
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',

    /** Enviado a agencia Shalom (provincias) */
    SHIPPED_AGENCY = 'SHIPPED_AGENCY',

    /** Entregado al cliente (estado final) */
    DELIVERED = 'DELIVERED',

    /** Cancelado manualmente por admin (estado final) */
    CANCELLED_MANUAL = 'CANCELLED_MANUAL',

    /** Expirado por TTL 20 minutos (estado final) */
    CANCELLED_EXPIRED = 'CANCELLED_EXPIRED',
}

/**
 * Máquina de estados: transiciones permitidas
 * 
 * Uso:
 * ```typescript
 * if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
 *   throw new Error('Transición inválida');
 * }
 * ```
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.SCHEDULED]: [
        OrderStatus.PAYMENT_REPORTED,
        OrderStatus.CANCELLED_MANUAL,
        OrderStatus.CANCELLED_EXPIRED,
    ],

    [OrderStatus.PAYMENT_REPORTED]: [
        OrderStatus.PAYMENT_VERIFIED,
        OrderStatus.CANCELLED_MANUAL,
    ],

    [OrderStatus.PAYMENT_VERIFIED]: [
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED_MANUAL, // Requiere revisión manual
    ],

    [OrderStatus.PREPARING]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.SHIPPED_AGENCY,
    ],

    [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.DELIVERED,
    ],

    [OrderStatus.SHIPPED_AGENCY]: [
        OrderStatus.DELIVERED,
    ],

    // Estados finales: sin transiciones
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED_MANUAL]: [],
    [OrderStatus.CANCELLED_EXPIRED]: [],
};

/**
 * Política de devolución de stock al cancelar
 * 
 * true = devolver stock automáticamente
 * false = NO devolver (requiere revisión manual)
 */
export const SHOULD_RESTORE_STOCK_ON_CANCEL: Record<OrderStatus, boolean> = {
    [OrderStatus.SCHEDULED]: true, // Pedido sin pagar → devolver
    [OrderStatus.PAYMENT_REPORTED]: true, // Pago reportado pero no verificado → devolver
    [OrderStatus.PAYMENT_VERIFIED]: false, // Pago confirmado → revisión manual
    [OrderStatus.PREPARING]: false, // Ya en preparación → revisión manual
    [OrderStatus.OUT_FOR_DELIVERY]: false, // Ya enviado → revisión manual
    [OrderStatus.SHIPPED_AGENCY]: false, // Ya enviado → revisión manual
    [OrderStatus.DELIVERED]: false, // Entregado → no aplica
    [OrderStatus.CANCELLED_MANUAL]: false, // Ya cancelado → no aplica
    [OrderStatus.CANCELLED_EXPIRED]: false, // Ya expirado → no aplica (stock ya devuelto por trigger)
};

export interface OrderStatusChange {
    from: OrderStatus | null;
    to: OrderStatus;
    changedBy: string; // email or uid
    changedAt: Date;
    reason?: string; // Opcional: motivo del cambio
}
