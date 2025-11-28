import { getProject, getMaterials, getAssessments } from '@/actions';
import { ProjectDetailClient } from './ProjectDetailClient';
import { notFound } from 'next/navigation';

// Force dynamic rendering since we use headers() in auth
export const dynamic = 'force-dynamic';

/**
 * Project Detail Page (Server Component)
 */
export default async function ProjectDetailPage({ params }) {
    const { projectId } = await params;

    const [projectResult, materialsResult, assessmentsResult] = await Promise.all([
        getProject(projectId),
        getMaterials(projectId),
        getAssessments(projectId),
    ]);

    if (projectResult.error === 'Project not found') {
        notFound();
    }

    return (
        <ProjectDetailClient
            project={projectResult.data}
            initialMaterials={materialsResult.data || []}
            initialAssessments={assessmentsResult.data || []}
            error={projectResult.error || materialsResult.error}
        />
    );
}
