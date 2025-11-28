'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

/**
 * Session Provider Component
 *
 * Wraps the app with NextAuth session context for client components
 */
export function SessionProvider({ children, session }) {
    return (
        <NextAuthSessionProvider session={session}>
            {children}
        </NextAuthSessionProvider>
    );
}
