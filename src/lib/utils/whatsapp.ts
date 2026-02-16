// lib/utils/whatsapp.ts

interface WhatsAppParams {
    publicCode: string;
    total: number;
    shippingType: 'DELIVERY' | 'AGENCY_COLLECT';
}

/**
 * Genera link de WhatsApp con mensaje pre-formateado
 */
export function generateWhatsAppLink(params: WhatsAppParams): string {
    const { publicCode, total, shippingType } = params;

    const shippingText = shippingType === 'DELIVERY'
        ? 'Delivery Lima Norte/Centro'
        : 'Agencia Shalom';

    const message = `Hola ODERA 05 STORE, acabo de realizar el pedido ${publicCode} por un total de S/${total.toFixed(2)}. Tipo de envío: ${shippingText}. Adjuntaré mi comprobante y mi código de operación.`;

    const whatsappNumber = '51916305297';

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
