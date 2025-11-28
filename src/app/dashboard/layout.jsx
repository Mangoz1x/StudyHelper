import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardHeader } from '@/components/dashboard/Header';

/**
 * Dashboard Layout
 *
 * Protected layout that requires authentication
 * Includes header with user menu
 */
export default async function DashboardLayout({ children }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/signin');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <DashboardHeader user={session.user} />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
