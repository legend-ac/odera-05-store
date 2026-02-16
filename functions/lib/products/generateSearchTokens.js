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
exports.onProductWrite = void 0;
// functions/src/products/generateSearchTokens.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Normaliza texto para búsqueda:
 * - Minúsculas
 * - Sin tildes/diacríticos
 * - Solo alfanuméricos
 */
function normalizeText(text) {
    const normalized = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/[^a-z0-9\s]/g, '') // Solo letras, números, espacios
        .trim();
    return normalized.split(/\s+/).filter(token => token.length > 2);
}
/**
 * Genera tokens de búsqueda para un producto
 */
function generateSearchTokens(product) {
    const tokens = new Set();
    // Nombre
    if (product.name) {
        normalizeText(product.name).forEach(t => tokens.add(t));
    }
    // Marca
    if (product.brand) {
        normalizeText(product.brand).forEach(t => tokens.add(t));
    }
    // Categoría
    if (product.category) {
        tokens.add(product.category.toLowerCase());
    }
    // Descripción (solo primeras 50 palabras para no saturar)
    if (product.description) {
        const descTokens = normalizeText(product.description).slice(0, 50);
        descTokens.forEach(t => tokens.add(t));
    }
    return Array.from(tokens);
}
/**
 * Trigger onCreate/onUpdate de productos
 * Genera searchTokens automáticamente
 */
exports.onProductWrite = functions.firestore
    .document('products/{productId}')
    .onWrite(async (change, context) => {
    if (!change.after.exists) {
        // Producto eliminado (soft delete), no hacer nada
        return null;
    }
    const product = change.after.data();
    const searchTokens = generateSearchTokens(product);
    // Actualizar solo si los tokens cambiaron
    const currentTokens = product?.searchTokens || [];
    const tokensChanged = JSON.stringify(currentTokens.sort()) !== JSON.stringify(searchTokens.sort());
    if (tokensChanged) {
        await change.after.ref.update({
            searchTokens,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Search tokens updated for product ${context.params.productId}: [${searchTokens.slice(0, 5).join(', ')}...]`);
    }
    return null;
});
//# sourceMappingURL=generateSearchTokens.js.map