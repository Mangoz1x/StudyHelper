'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, EmptyState } from '@/components/ui';
import { AddMaterialModal, MaterialCard } from '@/components/materials';
import { GenerateAssessmentModal, AssessmentCard } from '@/components/assessments';
import { deleteProject } from '@/actions';
import {
    ArrowLeft,
    Plus,
    Trash2,
    FileText,
    Sparkles,
    Book,
    GraduationCap,
    Beaker,
    Calculator,
    Globe,
    Code,
    Palette,
    Music,
    FileQuestion,
    MoreHorizontal,
    Clock,
    Target,
    TrendingUp,
} from 'lucide-react';

const ICON_MAP = {
    book: Book,
    'graduation-cap': GraduationCap,
    beaker: Beaker,
    calculator: Calculator,
    globe: Globe,
    code: Code,
    palette: Palette,
    music: Music,
};

/**
 * Project Detail Client Component
 */
export function ProjectDetailClient({ project, initialMaterials, initialAssessments = [], error }) {
    const router = useRouter();
    const [materials, setMaterials] = useState(initialMaterials);
    const [assessments, setAssessments] = useState(initialAssessments);
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (!project) {
        return null;
    }

    const IconComponent = ICON_MAP[project.icon] || Book;

    const handleMaterialAdded = (newMaterial) => {
        setMaterials((prev) => [...prev, newMaterial]);
    };

    const handleMaterialDeleted = (materialId) => {
        setMaterials((prev) => prev.filter((m) => m.id !== materialId));
    };

    const handleAssessmentGenerated = (newAssessment) => {
        setAssessments((prev) => [newAssessment, ...prev]);
    };

    const handleAssessmentDeleted = (assessmentId) => {
        setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
    };

    const handleDeleteProject = async () => {
        if (!confirm('Are you sure you want to delete this project? All materials will be deleted.')) {
            return;
        }

        setDeleting(true);
        const result = await deleteProject(project.id);
        setDeleting(false);

        if (result.success) {
            router.push('/dashboard/projects');
        }
    };

    // Calculate stats
    const readyMaterials = materials.filter((m) => m.status === 'ready').length;
    const totalAttempts = assessments.reduce((sum, a) => sum + (a.stats?.attemptCount || 0), 0);
    const avgScore = assessments.length > 0
        ? Math.round(assessments.reduce((sum, a) => sum + (a.stats?.averageScore || 0), 0) / assessments.length)
        : 0;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header */}
            <div className="bg-white rounded-xl">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    {/* Back link */}
                    <Link
                        href="/dashboard/projects"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        All Projects
                    </Link>

                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-5">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: project.color }}
                            >
                                <IconComponent className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {project.name}
                                </h1>
                                {project.description && (
                                    <p className="mt-1 text-gray-500 max-w-xl">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleDeleteProject}
                                loading={deleting}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-8 grid grid-cols-4 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-blue-50">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
                                <p className="text-sm text-gray-500">Materials</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-violet-50">
                                <FileQuestion className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
                                <p className="text-sm text-gray-500">Assessments</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-green-50">
                                <Target className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{totalAttempts}</p>
                                <p className="text-sm text-gray-500">Attempts</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-amber-50">
                                <TrendingUp className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{avgScore}%</p>
                                <p className="text-sm text-gray-500">Avg Score</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                    <button
                        onClick={() => setAddModalOpen(true)}
                        className="group p-5 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                                <Plus className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Add Material
                                </h3>
                                <p className="text-sm text-gray-500">
                                    PDFs, videos, or notes
                                </p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => setGenerateModalOpen(true)}
                        className="group p-5 rounded-2xl bg-white border border-gray-200 hover:border-violet-300 hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-violet-50 group-hover:bg-violet-100 transition-colors">
                                <Sparkles className="w-6 h-6 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Generate Quiz
                                </h3>
                                <p className="text-sm text-gray-500">
                                    AI-powered assessments
                                </p>
                            </div>
                        </div>
                    </button>

                    <Link
                        href={`/study/${project.id}`}
                        className="group p-5 rounded-2xl bg-white border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                                <Book className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Study Mode
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Chat with your materials
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Materials Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Materials
                            </h2>
                            <button
                                onClick={() => setAddModalOpen(true)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                + Add
                            </button>
                        </div>

                        {materials.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="font-medium text-gray-900 mb-1">No materials yet</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Add PDFs, videos, or notes to get started
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => setAddModalOpen(true)}
                                    leftIcon={<Plus className="w-4 h-4" />}
                                >
                                    Add Material
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {materials.map((material) => (
                                    <MaterialCard
                                        key={material.id}
                                        material={material}
                                        onDeleted={handleMaterialDeleted}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assessments Section */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Assessments
                            </h2>
                            <button
                                onClick={() => setGenerateModalOpen(true)}
                                className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                            >
                                + Generate
                            </button>
                        </div>

                        {assessments.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <FileQuestion className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="font-medium text-gray-900 mb-1">No assessments yet</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Generate a quiz from your materials
                                </p>
                                <Button
                                    size="sm"
                                    onClick={() => setGenerateModalOpen(true)}
                                    leftIcon={<Sparkles className="w-4 h-4" />}
                                >
                                    Generate Quiz
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assessments.map((assessment) => (
                                    <AssessmentCard
                                        key={assessment.id}
                                        assessment={assessment}
                                        projectId={project.id}
                                        onDeleted={handleAssessmentDeleted}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Material Modal */}
            <AddMaterialModal
                open={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                projectId={project.id}
                onMaterialAdded={handleMaterialAdded}
            />

            {/* Generate Assessment Modal */}
            <GenerateAssessmentModal
                open={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                projectId={project.id}
                materials={materials}
                onAssessmentGenerated={handleAssessmentGenerated}
            />
        </div>
    );
}
