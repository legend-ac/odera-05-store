import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Proteger ruta /dashboard (NO /admin)
    if (path.startsWith('/dashboard')) {
        const sessionCookie = request.cookies.get('__session');

        if (!sessionCookie) {
            console.log('❌ No session cookie, redirecting to login');
            return NextResponse.redirect(new URL('/login', request.url));
        }

        try {
            // Verificar token en servidor
            const response = await fetch(`${request.nextUrl.origin}/api/verify-admin`, {
                headers: {
                    'Cookie': `__session=${sessionCookie.value}`
                }
            });

            if (!response.ok) {
                console.log('❌ Session verification failed');
                return NextResponse.redirect(new URL('/login', request.url));
            }

            const { claims, authTime } = await response.json();

            // Verificar custom claim admin
            if (!claims.admin) {
                console.log('❌ User is not admin');
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }

            // Session lock: max 8 horas
            const now = Math.floor(Date.now() / 1000);
            const hoursSinceAuth = (now - authTime) / 3600;

            if (hoursSinceAuth > 8) {
                console.log('⚠️ Session expired (>8 hours)');
                return NextResponse.redirect(new URL('/session-expired', request.url));
            }

            console.log('✅ Admin access granted');

        } catch (error) {
            console.error('❌ Middleware error:', error);
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*']
};
