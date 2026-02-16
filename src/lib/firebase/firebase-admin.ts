// lib/firebase/firebase-admin.ts
/**
 * Firebase Admin SDK para servidor
 * Usado SOLO en API routes y middleware
 */

import * as admin from 'firebase-admin';

// Inicializar solo una vez
if (!admin.apps.length) {
    try {
        // En producción usa variables de entorno
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        // Para desarrollo local, usa service account key
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            const serviceAccount = JSON.parse(
                process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            );

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: projectId,
            });
        } else {
            // En producción (Vercel), usa credenciales por defecto
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                projectId: projectId,
            });
        }

        console.log('✅ Firebase Admin SDK initialized');
    } catch (error) {
        console.error('❌ Firebase Admin initialization error:', error);
    }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export { admin };
