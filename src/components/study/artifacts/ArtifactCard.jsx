'use client';

import { BookOpen, ListChecks, Layers, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useStudyMode } from '../StudyModeContext';

/**
 * Get icon for artifact type
 */
function getArtifactIcon(type) {
    switch (type) {
        case 'lesson':
            return BookOpen;
        case 'study_plan':
            return ListChecks;
        case 'flashcards':
            return Layers;
        default:
            return BookOpen;
    }
}

/**
 * Get badge styling based on action type
 */
function getActionBadge(actionType) {
    switch (actionType) {
        case 'created':
            return {
                text: 'Created',
                className: 'bg-green-100 text-green-700',
                icon: Plus,
            };
        case 'updated':
            return {
                text: 'Updated',
                className: 'bg-blue-100 text-blue-700',
                icon: RefreshCw,
            };
        case 'deleted':
            return {
                text: 'Deleted',
                className: 'bg-red-100 text-red-700',
                icon: Trash2,
            };
        default:
            return {
                text: actionType,
                className: 'bg-gray-100 text-gray-700',
                icon: null,
            };
    }
}

/**
 * Get type label
 */
function getTypeLabel(type) {
    switch (type) {
        case 'lesson':
            return 'Lesson';
        case 'study_plan':
            return 'Study Plan';
        case 'flashcards':
            return 'Flashcards';
        default:
            return type;
    }
}

/**
 * Artifact Card
 *
 * Clickable card displayed in chat when an artifact is created/updated.
 */
export function ArtifactCard({ artifactAction, onClick }) {
    const { openArtifact } = useStudyMode();

    const { artifactId, actionType, artifact } = artifactAction;
    const TypeIcon = getArtifactIcon(artifact?.type);
    const badge = getActionBadge(actionType);
    const BadgeIcon = badge.icon;

    const handleClick = () => {
        if (actionType !== 'deleted') {
            openArtifact(artifactId.toString());
        }
        onClick?.();
    };

    const isDeleted = actionType === 'deleted';

    return (
        <button
            onClick={handleClick}
            disabled={isDeleted}
            className={`
                w-full p-4 rounded-xl border text-left transition-all
                ${isDeleted
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 hover:border-violet-300 hover:shadow-md cursor-pointer'
                }
            `}
        >
            <div className="flex items-center gap-4">
                {/* Type icon */}
                <div className={`
                    p-3 rounded-xl flex-shrink-0
                    ${isDeleted ? 'bg-gray-100' : 'bg-white shadow-sm'}
                `}>
                    <TypeIcon className={`w-6 h-6 ${isDeleted ? 'text-gray-400' : 'text-violet-600'}`} />
                </div>

                <div className="flex-1 min-w-0">
                    {/* Type label and badge row */}
                    <div className="flex items-center gap-2 mb-1">
                        <p className={`text-xs uppercase tracking-wide font-medium ${isDeleted ? 'text-gray-400' : 'text-violet-600'}`}>
                            {getTypeLabel(artifact?.type)}
                        </p>
                        {/* Action badge */}
                        <span className={`
                            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                            ${badge.className}
                        `}>
                            {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                            {badge.text}
                        </span>
                    </div>

                    {/* Title */}
                    <h4 className={`font-semibold text-base ${isDeleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {artifact?.title || 'Untitled'}
                    </h4>

                    {/* Description */}
                    {artifact?.description && !isDeleted && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                            {artifact.description}
                        </p>
                    )}
                </div>

                {/* Arrow indicator */}
                {!isDeleted && (
                    <div className="flex-shrink-0 text-violet-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                )}
            </div>
        </button>
    );
}
