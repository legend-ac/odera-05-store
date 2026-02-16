import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { cookies } from 'next/headers';

/**
 * API Route para crear session cookie después del login
 * El frontend llama a esto después de Google Sign-In exitoso
 */
export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'No ID token provided' },
                { status: 400 }
            );
        }

        // Verificar ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Verificar que sea admin
        if (!decodedToken.admin) {
            return NextResponse.json(
                { error: 'User is not admin' },
                { status: 403 }
            );
        }

        // Crear session cookie (8 horas)
        const expiresIn = 60 * 60 * 8 * 1000; // 8 horas en ms
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Setear cookie
        const cookieStore = cookies();
        cookieStore.set('__session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return NextResponse.json({
            success: true,
            expiresIn: expiresIn / 1000,
        });

    } catch (error: any) {
        console.error('session-login error:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}
