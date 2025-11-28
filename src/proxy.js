/**
 * Next.js 16 Proxy for Route Protection
 *
 * This proxy runs on every request and handles:
 * - Auth session validation
 * - Protected route redirection
 *
 * Configure protected routes in the `protectedRoutes` array.
 *
 * Note: In Next.js 16, middleware.js was renamed to proxy.js
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * Routes that require authentication
 * Add paths that should be protected here
 */
const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    // Add more protected routes as needed
];

/**
 * Routes that should redirect authenticated users (e.g., login page)
 */
const authRoutes = [
    '/auth/signin',
    '/login',
];

/**
 * Proxy function - wraps NextAuth's auth middleware
 */
export const proxy = auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const pathname = nextUrl.pathname;

    // Check if current path is a protected route
    const isProtectedRoute = protectedRoutes.some(
        (route) => pathname.startsWith(route)
    );

    // Check if current path is an auth route
    const isAuthRoute = authRoutes.some(
        (route) => pathname.startsWith(route)
    );

    // Redirect unauthenticated users from protected routes to sign in
    if (isProtectedRoute && !isLoggedIn) {
        const signInUrl = new URL('/api/auth/signin', nextUrl.origin);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    // Redirect authenticated users from auth routes to dashboard
    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
    }

    return NextResponse.next();
});

/**
 * Proxy matcher configuration
 * Specifies which routes the proxy should run on
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api/auth (NextAuth routes - let them handle their own auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
    ],
};
