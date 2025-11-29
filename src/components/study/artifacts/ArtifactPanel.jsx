'use client';

import { useState } from 'react';
import { X, BookOpen, ListChecks, Layers, Trash2 } from 'lucide-react';
import { useStudyMode } from '../StudyModeContext';
import { LessonArtifact } from './LessonArtifact';
import { StudyPlanArtifact } from './StudyPlanArtifact';
import { FlashcardsArtifact } from './FlashcardsArtifact';

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
 * Artifact Panel
 *
 * Side panel that displays artifacts with tabs support.
 * Opens when an artifact is created or clicked.
 */
export function ArtifactPanel() {
    const {
        artifacts,
        artifactPanelOpen,
        activeArtifactId,
        openArtifactTabs,
        setActiveArtifactId,
        closeArtifactTab,
        setArtifactPanelOpen,
        removeArtifact,
    } = useStudyMode();

    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (!artifactPanelOpen || openArtifactTabs.length === 0) {
        return null;
    }

    // Get artifacts that are open in tabs
    const tabArtifacts = openArtifactTabs
        .map((id) => artifacts.find((a) => a.id === id))
        .filter(Boolean);

    // Get the active artifact
    const activeArtifact = artifacts.find((a) => a.id === activeArtifactId);

    const handleDelete = async () => {
        if (!activeArtifactId || isDeleting) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/study/artifacts/${activeArtifactId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                removeArtifact(activeArtifactId);
                setShowDeleteConfirm(false);
            } else {
                const data = await res.json();
                console.error('Failed to delete artifact:', data.error);
            }
        } catch (error) {
            console.error('Failed to delete artifact:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="w-1/2 border-l border-gray-200 flex flex-col bg-white relative">
            {/* Tabs header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center overflow-x-auto">
                    {tabArtifacts.map((artifact) => {
                        const Icon = getArtifactIcon(artifact.type);
                        const isActive = artifact.id === activeArtifactId;

                        return (
                            <div
                                key={artifact.id}
                                className={`
                                    flex items-center gap-2 px-4 py-2.5 border-r border-gray-200
                                    cursor-pointer transition-colors min-w-0 max-w-[200px]
                                    ${isActive ? 'bg-white border-b-2 border-b-violet-500' : 'hover:bg-gray-100'}
                                `}
                                onClick={() => setActiveArtifactId(artifact.id)}
                            >
                                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-gray-500'}`} />
                                <span className={`text-sm truncate ${isActive ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                    {artifact.title}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeArtifactTab(artifact.id);
                                    }}
                                    className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                >
                                    <X className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            </div>
                        );
                    })}

                    {/* Actions menu */}
                    <div className="ml-auto flex-shrink-0 px-2 flex items-center gap-1">
                        {/* Delete button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors group"
                            title="Delete artifact"
                        >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                        </button>

                        {/* Close panel button */}
                        <button
                            onClick={() => setArtifactPanelOpen(false)}
                            className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                            title="Close panel"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete confirmation modal */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Delete Artifact?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete &quot;{activeArtifact?.title}&quot;? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content area */}
            <div className="flex-1 overflow-y-auto">
                {activeArtifact ? (
                    <ArtifactContent artifact={activeArtifact} />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select an artifact to view
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Artifact Content Renderer
 *
 * Renders the appropriate component based on artifact type.
 */
function ArtifactContent({ artifact }) {
    switch (artifact.type) {
        case 'lesson':
            return <LessonArtifact artifact={artifact} />;
        case 'study_plan':
            return <StudyPlanArtifact artifact={artifact} />;
        case 'flashcards':
            return <FlashcardsArtifact artifact={artifact} />;
        default:
            return (
                <div className="p-6 text-gray-500">
                    Unknown artifact type: {artifact.type}
                </div>
            );
    }
}
