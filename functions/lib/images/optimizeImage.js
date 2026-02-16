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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeImage = void 0;
// functions/src/images/optimizeImage.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sharp_1 = __importDefault(require("sharp"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const fs_1 = require("fs");
const storage = admin.storage();
/**
 * Trigger cuando se sube una imagen a Storage
 * Genera versiones optimizadas (thumb y medium en WebP)
 *
 * ⚠️ CRÍTICO: 1GB RAM configurado - iPhone photos crashean con 256MB default
 */
exports.optimizeImage = functions
    .runWith({ memory: '1GB', timeoutSeconds: 120 })
    .storage
    .object()
    .onFinalize(async (object) => {
    const filePath = object.name;
    const contentType = object.contentType;
    // Solo procesar imágenes de productos
    if (!filePath.startsWith('products/') || !contentType?.startsWith('image/')) {
        return null;
    }
    // Ignorar si ya es optimizada
    if (filePath.includes('_thumb') || filePath.includes('_medium')) {
        return null;
    }
    console.log(`🖼️ Optimizing image: ${filePath}`);
    const bucket = storage.bucket(object.bucket);
    const fileName = path.basename(filePath);
    const fileDir = path.dirname(filePath);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    try {
        // 1. Descargar original
        await bucket.file(filePath).download({ destination: tempFilePath });
        // 2. Generar thumbnail (400px, max 200KB)
        const thumbFileName = fileName.replace(/\.[^.]+$/, '_thumb.webp');
        const thumbFilePath = path.join(os.tmpdir(), thumbFileName);
        let thumbQuality = 80;
        await (0, sharp_1.default)(tempFilePath)
            .resize(400, 400, { fit: 'cover', position: 'center' })
            .webp({ quality: thumbQuality })
            .toFile(thumbFilePath);
        // Verificar tamaño y reducir calidad si es necesario
        let thumbStats = await fs_1.promises.stat(thumbFilePath);
        while (thumbStats.size > 200 * 1024 && thumbQuality > 50) {
            thumbQuality -= 10;
            await (0, sharp_1.default)(tempFilePath)
                .resize(400, 400, { fit: 'cover', position: 'center' })
                .webp({ quality: thumbQuality })
                .toFile(thumbFilePath);
            thumbStats = await fs_1.promises.stat(thumbFilePath);
        }
        await bucket.upload(thumbFilePath, {
            destination: `${fileDir}/${thumbFileName}`,
            metadata: {
                contentType: 'image/webp',
                metadata: {
                    optimized: 'true',
                    originalName: fileName,
                },
            },
        });
        console.log(`✅ Thumb created: ${thumbFileName} (${(thumbStats.size / 1024).toFixed(2)}KB)`);
        // 3. Generar medium (1000px)
        const mediumFileName = fileName.replace(/\.[^.]+$/, '_medium.webp');
        const mediumFilePath = path.join(os.tmpdir(), mediumFileName);
        await (0, sharp_1.default)(tempFilePath)
            .resize(1000, 1000, { fit: 'inside' })
            .webp({ quality: 85 })
            .toFile(mediumFilePath);
        await bucket.upload(mediumFilePath, {
            destination: `${fileDir}/${mediumFileName}`,
            metadata: { contentType: 'image/webp' },
        });
        const mediumStats = await fs_1.promises.stat(mediumFilePath);
        console.log(`✅ Medium created: ${mediumFileName} (${(mediumStats.size / 1024).toFixed(2)}KB)`);
        // 4. Cleanup archivos temporales
        await fs_1.promises.unlink(tempFilePath);
        await fs_1.promises.unlink(thumbFilePath);
        await fs_1.promises.unlink(mediumFilePath);
        console.log(`🎉 Image optimization complete for ${filePath}`);
    }
    catch (error) {
        console.error('❌ Error optimizing image:', error);
    }
    return null;
});
//# sourceMappingURL=optimizeImage.js.map