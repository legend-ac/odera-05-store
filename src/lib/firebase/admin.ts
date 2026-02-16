// lib/firebase/admin.ts
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (server-side only)
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });

    console.log('✅ Firebase Admin SDK initialized');
}

// Export Firestore instance
export const adminDb = admin.firestore();

// Export Storage instance
export const adminStorage = admin.storage();

// Export Auth instance
export const adminAuth = admin.auth();

// Helper function to verify ID token
export async function verifyIdToken(token: string) {
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

// Helper function to get user role
export async function getUserRole(uid: string): Promise<string> {
    try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        return userDoc.data()?.role || 'user';
    } catch (error) {
        console.error('Error getting user role:', error);
        return 'user';
    }
}
