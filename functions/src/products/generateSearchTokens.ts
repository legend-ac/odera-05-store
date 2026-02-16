// functions/src/products/generateSearchTokens.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Normaliza texto para búsqueda:
 * - Minúsculas
 * - Sin tildes/diacríticos
 * - Solo alfanuméricos
 */
function normalizeText(text: string): string[] {
    const normalized = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
        .replace(/[^a-z0-9\s]/g, '')     // Solo letras, números, espacios
        .trim();

    return normalized.split(/\s+/).filter(token => token.length > 2);
}

/**
 * Genera tokens de búsqueda para un producto
 */
function generateSearchTokens(product: any): string[] {
    const tokens = new Set<string>();

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
export const onProductWrite = functions.firestore
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
