/**
 * Next.js Instrumentation
 *
 * This file is loaded once when the Next.js server starts.
 * Used for initializing server-side resources like database connections.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    // Only run on the server (Node.js runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { connectDB } = await import('@/utils/clients');

        try {
            await connectDB();
            console.log('Database connection established via instrumentation');
        } catch (error) {
            console.error('Failed to connect to database:', error);
            // Don't throw - allow app to start, connection will retry on first request
        }
    }
}
