'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    MessageSquare,
    Plus,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Pencil,
    Trash2,
    Archive,
    X,
    Check,
    Loader2,
    Brain,
    FileText,
    BookOpen,
    ListChecks,
    Layers,
} from 'lucide-react';
import { useStudyMode } from './StudyModeContext';
import { MemoriesModal } from './MemoriesModal';

/**
 * Study Chat Sidebar
 *
 * Collapsible sidebar showing chat list and memories panel.
 *
 * @param {Object} props
 * @param {string} props.activeChatId - Currently active chat ID
 */
export function StudyChatSidebar({ activeChatId }) {
    const pathname = usePathname();
    const router = useRouter();
    const { chats, memories, artifacts, projectId, sidebarOpen, setSidebarOpen, removeChat, updateChat, openArtifact } = useStudyMode();

    const [menuOpen, setMenuOpen] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [loading, setLoading] = useState(null);
    const [memoriesModalOpen, setMemoriesModalOpen] = useState(false);

    const handleNewChat = () => {
        router.push(`/study/${projectId}`);
    };

    const handleEditStart = (chat) => {
        setEditingId(chat.id || chat._id);
        setEditTitle(chat.title);
        setMenuOpen(null);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditTitle('');
    };

    const handleEditSave = async (chatId) => {
        if (!editTitle.trim()) return;

        setLoading(chatId);
        try {
            const res = await fetch(`/api/study/chats/${chatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editTitle.trim() }),
            });

            if (res.ok) {
                updateChat(chatId, { title: editTitle.trim() });
                setEditingId(null);
                setEditTitle('');
            }
        } catch (error) {
            console.error('Failed to rename chat:', error);
        } finally {
            setLoading(null);
        }
    };

    const handleArchive = async (chatId) => {
        setLoading(chatId);
        setMenuOpen(null);
        try {
            const res = await fetch(`/api/study/chats/${chatId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'archived' }),
            });

            if (res.ok) {
                removeChat(chatId);
                if (activeChatId === chatId) {
                    router.push(`/study/${projectId}`);
                }
            }
        } catch (error) {
            console.error('Failed to archive chat:', error);
        } finally {
            setLoading(null);
        }
    };

    const handleDelete = async (chatId) => {
        if (!confirm('Are you sure you want to delete this chat? This cannot be undone.')) {
            return;
        }

        setLoading(chatId);
        setMenuOpen(null);
        try {
            const res = await fetch(`/api/study/chats/${chatId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                removeChat(chatId);
                if (activeChatId === chatId) {
                    router.push(`/study/${projectId}`);
                }
            }
        } catch (error) {
            console.error('Failed to delete chat:', error);
        } finally {
            setLoading(null);
        }
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString();
    };

    const getArtifactIcon = (type) => {
        switch (type) {
            case 'lesson':
                return BookOpen;
            case 'study_plan':
                return ListChecks;
            case 'flashcards':
                return Layers;
            default:
                return FileText;
        }
    };

    // Collapsed state
    if (!sidebarOpen) {
        return (
            <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-4 gap-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Open sidebar"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                <button
                    onClick={handleNewChat}
                    className="p-2 rounded-lg bg-violet-100 hover:bg-violet-200 transition-colors"
                    title="New chat"
                >
                    <Plus className="w-5 h-5 text-violet-600" />
                </button>
            </div>
        );
    }

    return (
        <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Study Mode</h2>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Collapse sidebar"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Chat
                </button>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-2">
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">
                        Chats
                    </h3>

                    {chats.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No chats yet</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Start a new chat to begin studying
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {chats.map((chat) => {
                                const chatId = chat.id || chat._id;
                                const isActive = activeChatId === chatId;
                                const isEditing = editingId === chatId;
                                const isLoading = loading === chatId;

                                return (
                                    <div
                                        key={chatId}
                                        className={`group relative rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-violet-100'
                                                : 'hover:bg-gray-100'
                                        } ${menuOpen === chatId ? 'z-40' : ''}`}
                                    >
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 p-2">
                                                <input
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEditSave(chatId);
                                                        if (e.key === 'Escape') handleEditCancel();
                                                    }}
                                                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={handleEditCancel}
                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSave(chatId)}
                                                    disabled={isLoading}
                                                    className="p-1 text-violet-600 hover:text-violet-700"
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Check className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <Link
                                                    href={`/study/${projectId}/${chatId}`}
                                                    className="flex items-center gap-3 p-2 pr-8"
                                                >
                                                    <MessageSquare
                                                        className={`w-4 h-4 flex-shrink-0 ${
                                                            isActive ? 'text-violet-600' : 'text-gray-400'
                                                        }`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={`text-sm truncate ${
                                                                isActive
                                                                    ? 'text-violet-900 font-medium'
                                                                    : 'text-gray-700'
                                                            }`}
                                                        >
                                                            {chat.title}
                                                        </p>
                                                        <p className="text-xs text-gray-400 truncate">
                                                            {formatDate(chat.lastActivityAt || chat.createdAt)}
                                                        </p>
                                                    </div>
                                                </Link>

                                                {/* Menu button */}
                                                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setMenuOpen(menuOpen === chatId ? null : chatId);
                                                        }}
                                                        className={`p-1.5 rounded transition-colors ${
                                                            menuOpen === chatId
                                                                ? 'bg-gray-200'
                                                                : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        <MoreVertical className="w-4 h-4 text-gray-500" />
                                                    </button>

                                                    {/* Dropdown menu */}
                                                    {menuOpen === chatId && (
                                                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                                            <button
                                                                onClick={() => handleEditStart(chat)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                                Rename
                                                            </button>
                                                            <button
                                                                onClick={() => handleArchive(chatId)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                                Archive
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(chatId)}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Artifacts Section */}
                {artifacts.length > 0 && (
                    <div className="px-3 py-2 border-t border-gray-200">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 mb-2">
                            Artifacts
                        </h3>
                        <div className="space-y-1">
                            {artifacts.map((artifact) => {
                                const artifactId = artifact.id || artifact._id;
                                const ArtifactIcon = getArtifactIcon(artifact.type);

                                return (
                                    <button
                                        key={artifactId}
                                        onClick={() => openArtifact(artifactId.toString())}
                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
                                    >
                                        <div className="p-1.5 rounded bg-violet-100 flex-shrink-0">
                                            <ArtifactIcon className="w-3.5 h-3.5 text-violet-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-700 truncate">
                                                {artifact.title}
                                            </p>
                                            <p className="text-xs text-gray-400 capitalize">
                                                {artifact.type?.replace('_', ' ')}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Memories Button */}
            <div className="border-t border-gray-200 p-3">
                <button
                    onClick={() => setMemoriesModalOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-violet-600" />
                        <span className="font-medium text-gray-900">Memories</span>
                    </div>
                    {memories.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-violet-200 text-violet-700 rounded-full">
                            {memories.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Memories Modal */}
            <MemoriesModal
                open={memoriesModalOpen}
                onClose={() => setMemoriesModalOpen(false)}
            />
        </div>
    );
}
