import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// Force dynamic rendering since we use auth/headers
export const dynamic = 'force-dynamic';

/**
 * Dashboard Page
 *
 * Redirects to projects page (main functionality)
 */
export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect('/signin');
    }

    // Redirect to projects page since that's where the actual functionality is
    redirect('/dashboard/projects');
}
