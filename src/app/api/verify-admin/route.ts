import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebase-admin';
import { cookies } from 'next/headers';

/**
 * API Route para verificar si el usuario es admin
 * Usado por el middleware
 */
export async function GET(request: NextRequest) {
    try {
        const cookieStore = cookies();
        const sessionCookie = cookieStore.get('__session')?.value;

        if (!sessionCookie) {
            return NextResponse.json(
                { error: 'No session cookie' },
                { status: 401 }
            );
        }

        // Verificar session cookie
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

        return NextResponse.json({
            claims: decodedClaims,
            authTime: decodedClaims.auth_time
        });

    } catch (error: any) {
        console.error('verify-admin error:', error);
        return NextResponse.json(
            { error: 'Invalid session' },
            { status: 401 }
        );
    }
}
