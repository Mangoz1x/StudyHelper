import { getProjects } from '@/actions';
import { ProjectsPageClient } from './ProjectsPageClient';

// Force dynamic rendering since we use headers() in auth
export const dynamic = 'force-dynamic';

/**
 * Projects List Page (Server Component)
 *
 * Fetches projects and passes to client component
 */
export default async function ProjectsPage() {
    const { data: projects, error } = await getProjects();

    return <ProjectsPageClient initialProjects={projects || []} error={error} />;
}
