// functions/src/images/optimizeImage.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import { promises as fs } from 'fs';

const storage = admin.storage();

/**
 * Trigger cuando se sube una imagen a Storage
 * Genera versiones optimizadas (thumb y medium en WebP)
 * 
 * ⚠️ CRÍTICO: 1GB RAM configurado - iPhone photos crashean con 256MB default
 */
export const optimizeImage = functions
    .runWith({ memory: '1GB', timeoutSeconds: 120 })
    .storage
    .object()
    .onFinalize(async (object) => {
        const filePath = object.name!;
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
            await sharp(tempFilePath)
                .resize(400, 400, { fit: 'cover', position: 'center' })
                .webp({ quality: thumbQuality })
                .toFile(thumbFilePath);

            // Verificar tamaño y reducir calidad si es necesario
            let thumbStats = await fs.stat(thumbFilePath);
            while (thumbStats.size > 200 * 1024 && thumbQuality > 50) {
                thumbQuality -= 10;
                await sharp(tempFilePath)
                    .resize(400, 400, { fit: 'cover', position: 'center' })
                    .webp({ quality: thumbQuality })
                    .toFile(thumbFilePath);
                thumbStats = await fs.stat(thumbFilePath);
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

            await sharp(tempFilePath)
                .resize(1000, 1000, { fit: 'inside' })
                .webp({ quality: 85 })
                .toFile(mediumFilePath);

            await bucket.upload(mediumFilePath, {
                destination: `${fileDir}/${mediumFileName}`,
                metadata: { contentType: 'image/webp' },
            });

            const mediumStats = await fs.stat(mediumFilePath);
            console.log(`✅ Medium created: ${mediumFileName} (${(mediumStats.size / 1024).toFixed(2)}KB)`);

            // 4. Cleanup archivos temporales
            await fs.unlink(tempFilePath);
            await fs.unlink(thumbFilePath);
            await fs.unlink(mediumFilePath);

            console.log(`🎉 Image optimization complete for ${filePath}`);

        } catch (error) {
            console.error('❌ Error optimizing image:', error);
        }

        return null;
    });
