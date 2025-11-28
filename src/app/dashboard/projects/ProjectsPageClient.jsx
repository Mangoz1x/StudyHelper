'use client';

import { useState } from 'react';
import { Button, EmptyState } from '@/components/ui';
import { ProjectCard, CreateProjectModal } from '@/components/projects';
import { Plus, FolderOpen } from 'lucide-react';

/**
 * Projects Page Client Component
 *
 * Handles client-side interactions like opening the create modal
 */
export function ProjectsPageClient({ initialProjects, error }) {
    const [createModalOpen, setCreateModalOpen] = useState(false);

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Your Projects
                    </h1>
                    <p className="mt-1 text-gray-600">
                        Organize your study materials and create assessments
                    </p>
                </div>
                <Button
                    onClick={() => setCreateModalOpen(true)}
                    leftIcon={<Plus className="w-4 h-4" />}
                >
                    New Project
                </Button>
            </div>

            {/* Projects Grid */}
            {initialProjects.length === 0 ? (
                <EmptyState
                    icon={FolderOpen}
                    title="No projects yet"
                    description="Create your first project to start organizing your study materials and generating assessments."
                    action={
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            Create Project
                        </Button>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {initialProjects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}

            {/* Create Project Modal */}
            <CreateProjectModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
            />
        </div>
    );
}
