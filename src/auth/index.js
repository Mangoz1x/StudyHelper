/**
 * NextAuth.js v5 Configuration
 *
 * Main auth configuration file that exports handlers and helpers.
 *
 * Usage:
 * - Route handler: export { handlers } from '@/auth' in app/api/auth/[...nextauth]/route.js
 * - Server components: const session = await auth()
 * - Client components: useSession() from 'next-auth/react'
 * - Sign in/out: signIn(), signOut() from 'next-auth/react'
 */

import NextAuth from 'next-auth';
import { providers } from './providers';
import { MongooseAdapter } from './mongoose-adapter';
import { connectDB } from '@/utils/clients';

export const {
    handlers,
    auth,
    signIn,
    signOut,
} = NextAuth({
    // Use modular providers from providers/index.js
    providers,

    // Use custom Mongoose adapter
    adapter: MongooseAdapter(),

    // Session configuration
    session: {
        strategy: 'database', // Use database sessions (not JWT)
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // Update session every 24 hours
    },

    // Custom pages (optional - uncomment to use)
    // pages: {
    //     signIn: '/auth/signin',
    //     signOut: '/auth/signout',
    //     error: '/auth/error',
    //     verifyRequest: '/auth/verify-request',
    //     newUser: '/auth/new-user',
    // },

    // Callbacks for customizing behavior
    callbacks: {
        /**
         * Called when a session is checked
         * Add custom properties to the session here
         */
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
            }
            return session;
        },

        /**
         * Called whenever a user signs in
         * Return true to allow sign in, false to deny
         */
        async signIn({ user, account, profile }) {
            // Ensure DB is connected before auth operations
            await connectDB();
            return true;
        },
    },

    // Events for side effects (logging, analytics, etc.)
    events: {
        async signIn({ user, account, isNewUser }) {
            if (isNewUser) {
                console.log(`New user registered: ${user.email}`);
            }
        },
        async signOut({ session }) {
            console.log('User signed out');
        },
    },

    // Enable debug logging in development
    debug: process.env.NODE_ENV === 'development',
});
