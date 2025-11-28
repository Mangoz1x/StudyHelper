import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getProject, getStudyChats, getStudyMemories, getStudyArtifacts } from '@/actions';
import { StudyModeProvider } from '@/components/study';
import { StudyChatSidebar } from '@/components/study/StudyChatSidebar';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Force dynamic rendering since we use headers() in auth
export const dynamic = 'force-dynamic';

/**
 * Study Mode Layout
 *
 * Full-screen layout for study mode, outside of dashboard constraints.
 */
export default async function StudyModeLayout({ children, params }) {
    const session = await auth();

    if (!session?.user) {
        redirect('/signin');
    }

    const { projectId } = await params;

    const [projectResult, chatsResult, memoriesResult, artifactsResult] = await Promise.all([
        getProject(projectId),
        getStudyChats(projectId),
        getStudyMemories(projectId),
        getStudyArtifacts(projectId),
    ]);

    if (projectResult.error === 'Project not found') {
        notFound();
    }

    const project = projectResult.data;
    const chats = chatsResult.data || [];
    const memories = memoriesResult.data || [];
    const artifacts = artifactsResult.data || [];

    return (
        <StudyModeProvider
            projectId={projectId}
            project={project}
            initialChats={chats}
            initialMemories={memories}
            initialArtifacts={artifacts}
        >
            <div className="h-screen flex flex-col bg-white">
                {/* Minimal Header */}
                <header className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href={`/dashboard/projects/${projectId}`}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="text-sm font-medium">Back</span>
                            </Link>
                            <div className="h-5 w-px bg-gray-200" />
                            <h1 className="text-base font-semibold text-gray-900">
                                {project?.name || 'Study Mode'}
                            </h1>
                        </div>
                    </div>
                </header>

                {/* Main content with sidebar */}
                <div className="flex-1 flex overflow-hidden">
                    <StudyChatSidebar />
                    <main className="flex-1 flex flex-col overflow-hidden bg-white">
                        {children}
                    </main>
                </div>
            </div>
        </StudyModeProvider>
    );
}
