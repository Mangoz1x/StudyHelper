'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useStudyMode } from './StudyModeContext';

/**
 * Delete Artifact Modal
 *
 * Confirmation modal for deleting an artifact.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Object} props.artifact - The artifact to delete
 */
export function DeleteArtifactModal({ open, onClose, artifact }) {
    const { removeArtifact } = useStudyMode();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!open || !artifact) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/study/artifacts/${artifact.id || artifact._id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                removeArtifact(artifact.id || artifact._id);
                onClose();
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Delete Artifact?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete &quot;{artifact.title}&quot;? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
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
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        disabled={isDeleting}
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}
