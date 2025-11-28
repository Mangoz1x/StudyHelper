'use client';

import { useState } from 'react';
import { Brain, Trash2, Edit2, Check, X, Lightbulb, Target, TrendingUp, TrendingDown, Settings, HelpCircle } from 'lucide-react';
import { useStudyMode } from './StudyModeContext';

/**
 * Memories Panel Component
 *
 * Displays and manages AI-saved memories about the student.
 * Shows in the sidebar of the study mode interface.
 */
export function MemoriesPanel() {
    const { memories, projectId, updateMemory, removeMemory } = useStudyMode();
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [loading, setLoading] = useState(null);

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

    if (memories.length === 0) {
        return (
            <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-violet-600" />
                    <h3 className="font-semibold text-gray-900">Memories</h3>
                </div>
                <div className="text-center py-8">
                    <Brain className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                        No memories yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        As you study, I&apos;ll remember important things about your learning.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-violet-600" />
                <h3 className="font-semibold text-gray-900">Memories</h3>
                <span className="text-xs text-gray-500">({memories.length})</span>
            </div>

            <div className="space-y-3">
                {memories.map((memory) => {
                    const memoryId = memory.id || memory._id;
                    const isEditing = editingId === memoryId;
                    const isLoading = loading === memoryId;

                    return (
                        <div
                            key={memoryId}
                            className={`p-3 rounded-lg border transition-colors ${
                                isEditing ? 'border-violet-300 bg-violet-50' : 'border-gray-200 bg-white'
                            }`}
                        >
                            {/* Category badge */}
                            <div className="flex items-center justify-between mb-2">
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(
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
                                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Edit memory"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(memoryId)}
                                            disabled={isLoading}
                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                            title="Delete memory"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                        rows={3}
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={isLoading}
                                            className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleSaveEdit(memoryId)}
                                            disabled={isLoading || !editContent.trim()}
                                            className="p-1.5 text-violet-600 hover:text-violet-700 transition-colors disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700">{memory.content}</p>
                            )}

                            {/* Source info */}
                            {memory.sourceMessageId && (
                                <p className="text-xs text-gray-400 mt-2">
                                    From conversation
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
