// Configuración Nodemailer para envío de emails con Gmail gratuito
import nodemailer from 'nodemailer';

// Crear transporter (reutilizable)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, // odera05store@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD, // App Password de Gmail (16 caracteres)
    },
});

// Verificar configuración (opcional, en desarrollo)
if (process.env.NODE_ENV === 'development') {
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ Nodemailer config error:', error);
        } else {
            console.log('✅ Nodemailer ready to send emails');
        }
    });
}

/**
 * Enviar email de confirmación de pedido
 */
export async function sendOrderConfirmation(order: any) {
    const { publicCode, customer, items, total, shippingType } = order;

    // Generar HTML del pedido
    const itemsHtml = items
        .map(
            (item: any) => `
    <tr>
      <td>${item.nameSnapshot}</td>
      <td>${item.variantSnapshot.size} / ${item.variantSnapshot.color}</td>
      <td>${item.quantity}</td>
      <td>S/ ${item.unitPriceSnapshot.toFixed(2)}</td>
    </tr>
  `
        )
        .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-code { font-size: 24px; font-weight: bold; color: #e74c3c; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; font-weight: bold; }
        .total { font-size: 20px; font-weight: bold; color: #27ae60; text-align: right; }
        .instructions { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ODERA 05 STORE</h1>
          <p>Confirmación de Pedido</p>
        </div>
        
        <div class="content">
          <h2>¡Gracias por tu pedido!</h2>
          
          <p>Hola <strong>${customer.name}</strong>,</p>
          <p>Hemos recibido tu pedido correctamente.</p>
          
          <div class="order-code">
            📦 Código: ${publicCode}
          </div>
          
          <h3>Detalle del Pedido:</h3>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Talla/Color</th>
                <th>Cantidad</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <p class="total">TOTAL: S/ ${total.toFixed(2)}</p>
          
          <div class="instructions">
            <h3>⚠️ IMPORTANTE - Siguiente Paso:</h3>
            <ol>
              <li>Realiza el pago por <strong>Yape o Plin</strong> al número: <strong>916 305 297</strong></li>
              <li>Toma captura de tu comprobante de pago</li>
              <li>Envíalo junto con tu código de pedido (<strong>${publicCode}</strong>) a nuestro WhatsApp: <strong>916 305 297</strong></li>
            </ol>
            <p>⏰ <strong>Tiempo límite:</strong> 20 minutos para enviar comprobante</p>
          </div>
          
          <p><strong>Envío:</strong> ${shippingType === 'DELIVERY'
            ? 'Delivery Lima Norte (S/ 15)'
            : 'Agencia Shalom (gratis)'
        }</p>
          
          <p>Cualquier duda, contáctanos al WhatsApp: <a href="https://wa.me/51916305297">916 305 297</a></p>
        </div>
        
        <div class="footer">
          <p>Este es un email automático, por favor no responder.</p>
          <p>ODERA 05 STORE - Moda urbana de calidad</p>
        </div>
      </div>
    </body>
    </html>
  `;

    // Verificar que el cliente tenga email
    if (!customer.email) {
        console.warn(`⚠️ Order ${publicCode}: No email provided, skipping`);
        return { success: false, reason: 'No email provided' };
    }

    try {
        const info = await transporter.sendMail({
            from: '"ODERA 05 STORE" <odera05store@gmail.com>',
            to: customer.email,
            subject: `Pedido ${publicCode} - Confirmación ODERA 05`,
            html,
        });

        console.log(`✅ Email sent to ${customer.email}:`, info.messageId);

        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error: any) {
        console.error(`❌ Email error for order ${publicCode}:`, error);

        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Enviar email de confirmación de pago (admin verificó)
 */
export async function sendPaymentConfirmed(order: any) {
    const { publicCode, customer } = order;

    if (!customer.email) return { success: false };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #27ae60; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .code { font-size: 24px; color: #27ae60; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Pago Confirmado</h1>
        </div>
        <div class="content">
          <p>Hola <strong>${customer.name}</strong>,</p>
          <p>Hemos verificado tu pago. Tu pedido está siendo preparado.</p>
          <p class="code">Código: ${publicCode}</p>
          <p>Te notificaremos cuando esté listo para envío.</p>
          <p>Gracias por tu compra!</p>
        </div>
      </div>
    </body>
    </html>
  `;

    try {
        const info = await transporter.sendMail({
            from: '"ODERA 05 STORE" <odera05store@gmail.com>',
            to: customer.email,
            subject: `✅ Pago Confirmado - Pedido ${publicCode}`,
            html,
        });

        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
}
