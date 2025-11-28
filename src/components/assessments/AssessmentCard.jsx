'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button } from '@/components/ui';
import { deleteAssessment } from '@/actions';
import {
    FileQuestion,
    Play,
    BarChart3,
    Trash2,
    Clock,
    Target,
    CheckCircle2,
    MoreVertical,
} from 'lucide-react';

const DIFFICULTY_COLORS = {
    easy: 'bg-green-50 text-green-700',
    medium: 'bg-amber-50 text-amber-700',
    hard: 'bg-red-50 text-red-700',
    mixed: 'bg-violet-50 text-violet-700',
};

/**
 * Assessment Card Component
 */
export function AssessmentCard({ assessment, projectId, onDeleted }) {
    const [deleting, setDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this assessment?')) {
            return;
        }

        setDeleting(true);
        const result = await deleteAssessment(assessment.id);
        setDeleting(false);

        if (result.success) {
            onDeleted?.(assessment.id);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Unknown date';
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return 'Unknown date';
        }
    };

    const questionTypes = assessment.settings?.questionTypes || [];
    // Use questions array length if questionCount is missing or 0
    const actualQuestionCount = assessment.questionCount || assessment.questions?.length || 0;

    return (
        <Card variant="default" className="group hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                            <FileQuestion className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="mb-3">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                                {assessment.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {formatDate(assessment.createdAt)}
                            </p>
                        </div>

                        {assessment.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                {assessment.description}
                            </p>
                        )}

                        {/* Stats row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                            <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                                <Target className="w-4 h-4 text-gray-500" />
                                {actualQuestionCount} {actualQuestionCount === 1 ? 'question' : 'questions'}
                            </span>
                            <span className="flex items-center gap-1.5 text-gray-700 font-medium">
                                <CheckCircle2 className="w-4 h-4 text-gray-500" />
                                {assessment.totalPoints} {assessment.totalPoints === 1 ? 'point' : 'points'}
                            </span>
                            {assessment.settings?.difficulty && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${DIFFICULTY_COLORS[assessment.settings.difficulty]}`}>
                                    {assessment.settings.difficulty}
                                </span>
                            )}
                        </div>

                        {/* Question types */}
                        {questionTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {questionTypes.map((type) => (
                                    <span
                                        key={type}
                                        className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 font-medium capitalize"
                                    >
                                        {type.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Attempt stats */}
                        {assessment.stats?.attemptCount > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-5 text-sm">
                                <span className="flex items-center gap-1.5 text-gray-600">
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="font-medium">{assessment.stats.attemptCount}</span> attempt{assessment.stats.attemptCount !== 1 ? 's' : ''}
                                </span>
                                {assessment.stats.averageScore > 0 && (
                                    <span className="text-gray-600">
                                        Avg: <span className="font-semibold">{assessment.stats.averageScore}%</span>
                                    </span>
                                )}
                                {assessment.stats.highestScore > 0 && (
                                    <span className="text-green-600">
                                        Best: <span className="font-semibold">{assessment.stats.highestScore}%</span>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <Link href={`/dashboard/projects/${projectId}/assessments/${assessment.id}`}>
                            <Button
                                size="md"
                                leftIcon={<Play className="w-4 h-4" />}
                                className="w-full"
                            >
                                Start
                            </Button>
                        </Link>

                        <div className="relative">
                            <Button
                                size="md"
                                variant="ghost"
                                onClick={() => setShowMenu(!showMenu)}
                                className="w-full"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>

                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleDelete();
                                            }}
                                            disabled={deleting}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {deleting ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
