import Google from 'next-auth/providers/google';

/**
 * Google OAuth Provider Configuration
 *
 * Required environment variables:
 * - GOOGLE_CLIENT_ID: OAuth client ID from Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: OAuth client secret from Google Cloud Console
 *
 * Setup instructions:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create or select a project
 * 3. Navigate to APIs & Services > Credentials
 * 4. Create OAuth 2.0 Client ID (Web application)
 * 5. Add authorized redirect URI: http://localhost:3000/api/auth/callback/google
 * 6. For production, add your production URL callback
 */

const googleProvider = Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Optional: customize authorization params
    // authorization: {
    //     params: {
    //         prompt: 'consent',
    //         access_type: 'offline',
    //         response_type: 'code',
    //     },
    // },
});

export default googleProvider;
