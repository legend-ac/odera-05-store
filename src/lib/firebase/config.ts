// lib/firebase/config.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// REMOVED: Firestore, Storage, Functions (now using API routes with Admin SDK)
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services (AUTH ONLY - rest via API routes)
export const auth = getAuth(app);
// Removed: db, storage, functions (now server-side via API routes)

// Initialize App Check (production only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (siteKey) {
        initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider(siteKey),
            isTokenAutoRefreshEnabled: true,
        });
        console.log('✅ App Check initialized');
    } else {
        console.warn('⚠️ App Check not initialized: missing RECAPTCHA_SITE_KEY');
    }
}

export { app };
