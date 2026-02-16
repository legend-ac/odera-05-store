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
exports.onOrderStatusChange = void 0;
// functions/src/orders/onOrderStatusChange.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Trigger cuando cambia el estado de una orden
 * Registra en audit log
 *
 * Email sending se configurará después con Resend
 */
exports.onOrderStatusChange = functions.firestore
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
    }
    catch (error) {
        console.error('❌ Error in onOrderStatusChange:', error);
    }
    return null;
});
//# sourceMappingURL=onOrderStatusChange.js.map