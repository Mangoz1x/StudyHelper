'use client';

import { useState } from 'react';
import { ListChecks, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { useStudyMode } from '../StudyModeContext';

/**
 * Study Plan Artifact
 *
 * Renders a study plan with checkable items.
 */
export function StudyPlanArtifact({ artifact }) {
    const items = artifact.content?.items || [];

    // Calculate progress
    const totalItems = items.reduce((acc, item) => {
        const childCount = item.children?.length || 0;
        return acc + 1 + childCount;
    }, 0);

    const completedItems = items.reduce((acc, item) => {
        const childCompleted = item.children?.filter((c) => c.completed).length || 0;
        return acc + (item.completed ? 1 : 0) + childCompleted;
    }, 0);

    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-violet-600 mb-2">
                    <ListChecks className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-wide">Study Plan</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{artifact.title}</h2>
                {artifact.description && (
                    <p className="text-gray-600 mt-1">{artifact.description}</p>
                )}

                {/* Progress bar */}
                {totalItems > 0 && (
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium text-gray-900">
                                {completedItems} / {totalItems} ({progressPercent}%)
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-violet-500 transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="space-y-2">
                {items.length === 0 ? (
                    <p className="text-gray-500 italic">No items yet.</p>
                ) : (
                    items.map((item) => (
                        <PlanItem
                            key={item.id}
                            item={item}
                            artifactId={artifact.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

/**
 * Plan Item
 *
 * A checkable item in the study plan with optional nested children.
 */
function PlanItem({ item, artifactId, isChild = false, parentId = null }) {
    const { updateArtifact, artifacts } = useStudyMode();
    const [expanded, setExpanded] = useState(true);
    const [loading, setLoading] = useState(false);

    const hasChildren = item.children && item.children.length > 0;

    const handleToggle = async () => {
        setLoading(true);

        try {
            const body = isChild
                ? { itemId: parentId, childId: item.id, completed: !item.completed }
                : { itemId: item.id, completed: !item.completed };

            const res = await fetch(`/api/study/artifacts/${artifactId}/progress`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                // Update artifact in context
                updateArtifact(artifactId, {
                    content: data.data.content,
                });
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={isChild ? 'ml-6' : ''}>
            <div
                className={`
                    flex items-start gap-3 p-3 rounded-lg transition-colors
                    ${item.completed ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'}
                `}
            >
                {/* Expand/collapse button for items with children */}
                {hasChildren && !isChild && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0 mt-0.5"
                    >
                        {expanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                    </button>
                )}

                {/* Checkbox */}
                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`
                        flex-shrink-0 mt-0.5 transition-colors
                        ${loading ? 'opacity-50' : ''}
                    `}
                >
                    {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                        <Circle className="w-5 h-5 text-gray-400 hover:text-violet-500" />
                    )}
                </button>

                {/* Text */}
                <span
                    className={`
                        flex-1 text-sm
                        ${item.completed ? 'text-gray-500 line-through' : 'text-gray-700'}
                    `}
                >
                    {item.text}
                </span>
            </div>

            {/* Children */}
            {hasChildren && expanded && (
                <div className="mt-1 space-y-1">
                    {item.children.map((child) => (
                        <PlanItem
                            key={child.id}
                            item={child}
                            artifactId={artifactId}
                            isChild
                            parentId={item.id}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
