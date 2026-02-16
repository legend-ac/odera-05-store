// types/index.ts
import { Timestamp } from 'firebase/firestore';

export type OrderStatus =
    | 'SCHEDULED'
    | 'PREPARING'
    | 'OUT_FOR_DELIVERY'
    | 'SHIPPED_AGENCY'
    | 'READY_FOR_PICKUP'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'CANCELLED_EXPIRED';

export interface Product {
    id: string;
    publicCode: string;
    name: string;
    slug: string;
    description: string;
    category: 'zapatillas' | 'ropa' | 'mochilas' | 'accesorios';
    brand: string;
    price: number;
    salePrice?: number;
    onSale: boolean;
    images: ProductImage[];
    coverImageUrl: string;
    variants: ProductVariant[];
    totalStock: number;
    searchTokens: string[];
    status: 'active' | 'archived';
    isNew: boolean;
    isFeatured: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

export interface ProductImage {
    id: string;
    originalUrl: string;
    mediumUrl: string;
    thumbUrl: string;
    order: number;
    isCover: boolean;
}

export interface ProductVariant {
    id: string;
    size?: string;
    color?: string;
    stock: number;
    sku?: string;
}

export interface Order {
    id: string;
    publicCode: string;
    userId?: string;
    customer: CustomerInfo;
    items: OrderItemSnapshot[];
    subtotal: number;
    shippingCost: number;
    total: number;
    status: OrderStatus;
    statusHistory: StatusChange[];
    reservedUntil: Timestamp;
    stockReserved: boolean;
    shippingType: 'DELIVERY' | 'AGENCY_COLLECT';
    shippingInfo: DeliveryInfo | AgencyInfo;
    paymentMethod: 'yape' | 'plin';
    operationCode?: string;
    paymentVerified: boolean;
    paymentVerifiedAt?: Timestamp;
    paymentVerifiedBy?: string;
    whatsappSent: boolean;
    emailSent: boolean;
    customerNotes?: string;
    adminNotes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface OrderItemSnapshot {
    productId: string;
    productPublicCode: string;
    variantId: string;
    nameSnapshot: string;
    imageSnapshot: string;
    variantSnapshot: {
        size?: string;
        color?: string;
    };
    unitPriceSnapshot: number;
    quantity: number;
}

export interface StatusChange {
    from: OrderStatus | null;
    to: OrderStatus;
    changedBy: string;
    changedAt: Timestamp;
    reason?: string;
}

export interface CustomerInfo {
    name: string;
    phone: string;
    email?: string;
}

export interface DeliveryInfo {
    type: 'DELIVERY';
    district: string;
    address: string;
    reference: string;
}

export interface AgencyInfo {
    type: 'AGENCY_COLLECT';
    department: string;
    province: string;
    district: string;
    dni: string;
    agency: 'Shalom';
    customerAccepted: boolean;
}

export interface StoreSettings {
    storeName: string;
    logo: string;
    description: string;
    whatsapp: string;
    email: string;
    ordersEmailToNotify: string;
    social: {
        facebook?: string;
        instagram?: string;
    };
    yape: {
        enabled: boolean;
        number: string;
        holder: string;
    };
    plin: {
        enabled: boolean;
        number: string;
        holder: string;
    };
    delivery: {
        enabled: boolean;
        cost: number;
        districts: string[];
    };
    agency: {
        name: string;
        enabled: boolean;
    };
    updatedAt: Timestamp;
    updatedBy: string;
}
