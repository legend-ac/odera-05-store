// functions/src/orders/onOrderStatusChange.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Trigger cuando cambia el estado de una orden
 * Registra en audit log
 * 
 * Email sending se configurará después con Resend
 */
export const onOrderStatusChange = functions.firestore
  .document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Solo actuar si el estado cambió
    if (before.status === after.status) {
      return null;
    }

    console.log(`📧 Order ${after.publicCode}: ${before.status} → ${after.status}`);

    try {
      // Audit log
      await db.collection('auditLogs').add({
        entity: 'order',
        entityId: context.params.orderId,
        action: 'status_changed',
        previousValue: before.status,
        newValue: after.status,
        performedBy: after.statusHistory[after.statusHistory.length - 1].changedBy,
        performedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Audit log created for status change`);

    } catch (error) {
      console.error('❌ Error in onOrderStatusChange:', error);
    }

    return null;
  });
