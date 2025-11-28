/**
 * Auth Providers Registry
 *
 * Add new providers here to enable them in the application.
 * Each provider should be imported from its own file for modularity.
 *
 * To add a new provider:
 * 1. Create a new file in this directory (e.g., github.js)
 * 2. Configure the provider with its required options
 * 3. Import and add it to the providers array below
 * 4. Add required environment variables to .env.local
 *
 * Example for adding GitHub:
 * ```
 * // providers/github.js
 * import GitHub from 'next-auth/providers/github';
 * export default GitHub({
 *     clientId: process.env.GITHUB_CLIENT_ID,
 *     clientSecret: process.env.GITHUB_CLIENT_SECRET,
 * });
 *
 * // Then in this file:
 * import githubProvider from './github';
 * export const providers = [googleProvider, githubProvider];
 * ```
 */

import googleProvider from './google';

/**
 * Array of all enabled authentication providers
 * Order determines the display order on the sign-in page
 */
export const providers = [
    googleProvider,
    // Add more providers here as needed:
    // githubProvider,
    // discordProvider,
    // credentialsProvider,
];

/**
 * Provider metadata for UI customization
 * Useful for building custom sign-in pages
 */
export const providerMetadata = {
    google: {
        name: 'Google',
        icon: '/icons/google.svg', // Add your own icon
        bgColor: '#ffffff',
        textColor: '#000000',
    },
    // Add metadata for other providers as you add them
};
