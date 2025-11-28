'use client';

import { useState } from 'react';
import { Brain, Trash2, Edit2, Check, X, Lightbulb, Target, TrendingUp, TrendingDown, Settings, HelpCircle } from 'lucide-react';
import { useStudyMode } from './StudyModeContext';

/**
 * Memories Modal Component
 *
 * Modal for viewing and managing AI-saved memories about the student.
 */
export function MemoriesModal({ open, onClose }) {
    const { memories, updateMemory, removeMemory } = useStudyMode();
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(null);

    if (!open) return null;

    const handleEdit = (memory) => {
        setEditingId(memory.id || memory._id);
        setEditContent(memory.content);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleSaveEdit = async (memoryId) => {
        if (!editContent.trim()) return;

        setLoading(memoryId);
        try {
            const res = await fetch(`/api/study/memories/${memoryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent.trim() }),
            });

            if (res.ok) {
                updateMemory(memoryId, { content: editContent.trim() });
                setEditingId(null);
                setEditContent('');
            }
        } catch (error) {
            console.error('Failed to update memory:', error);
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (memoryId) => {
        setLoading(memoryId);
        try {
            const res = await fetch(`/api/study/memories/${memoryId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                removeMemory(memoryId);
            }
        } catch (error) {
            console.error('Failed to delete memory:', error);
        } finally {
            setLoading(null);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'preference':
                return <Settings className="w-3.5 h-3.5" />;
            case 'understanding':
                return <Lightbulb className="w-3.5 h-3.5" />;
            case 'weakness':
                return <TrendingDown className="w-3.5 h-3.5" />;
            case 'strength':
                return <TrendingUp className="w-3.5 h-3.5" />;
            case 'goal':
                return <Target className="w-3.5 h-3.5" />;
            default:
                return <HelpCircle className="w-3.5 h-3.5" />;
        }
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'preference':
                return 'bg-blue-100 text-blue-700';
            case 'understanding':
                return 'bg-yellow-100 text-yellow-700';
            case 'weakness':
                return 'bg-red-100 text-red-700';
            case 'strength':
                return 'bg-green-100 text-green-700';
            case 'goal':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-100">
                            <Brain className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Memories</h2>
                            <p className="text-sm text-gray-500">
                                {memories.length} {memories.length === 1 ? 'memory' : 'memories'} saved
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {memories.length === 0 ? (
                        <div className="text-center py-12">
                            <Brain className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="font-medium text-gray-900 mb-1">No memories yet</h3>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                As you study, I&apos;ll remember important things about your learning style and progress.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {memories.map((memory) => {
                                const memoryId = memory.id || memory._id;
                                const isEditing = editingId === memoryId;
                                const isLoading = loading === memoryId;

                                return (
                                    <div
                                        key={memoryId}
                                        className={`p-4 rounded-xl border transition-colors ${
                                            isEditing ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        {/* Category badge and actions */}
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getCategoryColor(
                                                    memory.category
                                                )}`}
                                            >
                                                {getCategoryIcon(memory.category)}
                                                {memory.category}
                                            </span>

                                            {!isEditing && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleEdit(memory)}
                                                        disabled={isLoading}
                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                                                        title="Edit memory"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(memoryId)}
                                                        disabled={isLoading}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                                                        title="Delete memory"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        {isEditing ? (
                                            <div className="space-y-2">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full p-3 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                    rows={3}
                                                    autoFocus
                                                />
                                                <div className="flex items-center gap-2 justify-end">
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        disabled={isLoading}
                                                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(memoryId)}
                                                        disabled={isLoading || !editContent.trim()}
                                                        className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-700">{memory.content}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-500 text-center">
                        Memories help personalize your learning experience
                    </p>
                </div>
            </div>
        </div>
    );
}
