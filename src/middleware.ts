import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// Define protected routes
const protectedRoutes = ['/dashboard', '/profile', '/orders', '/checkout'];
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if route requires authentication
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute || isAdminRoute) {
        const session = await auth();

        // Redirect to sign-in if not authenticated
        if (!session) {
            const signInUrl = new URL('/auth/signin', request.url);
            signInUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(signInUrl);
        }

        // Check admin access
        if (isAdminRoute && session.user.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
