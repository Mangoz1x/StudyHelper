'use client';

import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Study Mode Context
 *
 * Provides shared state for the study mode interface:
 * - List of chats
 * - Project memories
 * - Sidebar state
 * - Active chat tracking
 */

const StudyModeContext = createContext(null);

/**
 * Study Mode Provider
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Array} props.initialChats - Initial list of chats
 * @param {Array} props.initialMemories - Initial list of memories
 * @param {string} props.projectId - Project ID
 * @param {Object} props.project - Full project object
 */
export function StudyModeProvider({
    children,
    initialChats = [],
    initialMemories = [],
    projectId,
    project,
}) {
    const [chats, setChats] = useState(initialChats);
    const [memories, setMemories] = useState(initialMemories);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Add a new chat to the list
    const addChat = useCallback((chat) => {
        setChats((prev) => [chat, ...prev]);
    }, []);

    // Update a chat in the list
    const updateChat = useCallback((chatId, updates) => {
        setChats((prev) =>
            prev.map((c) => (c.id === chatId ? { ...c, ...updates } : c))
        );
    }, []);

    // Remove a chat from the list
    const removeChat = useCallback((chatId) => {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
    }, []);

    // Update chat activity (moves it to top)
    const updateChatActivity = useCallback((chatId) => {
        setChats((prev) => {
            const updated = prev.map((c) =>
                c.id === chatId ? { ...c, lastActivityAt: new Date().toISOString() } : c
            );
            return updated.sort(
                (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt)
            );
        });
    }, []);

    // Add a new memory
    const addMemory = useCallback((memory) => {
        setMemories((prev) => [memory, ...prev]);
    }, []);

    // Update a memory
    const updateMemory = useCallback((memoryId, updates) => {
        setMemories((prev) =>
            prev.map((m) => (m.id === memoryId ? { ...m, ...updates } : m))
        );
    }, []);

    // Remove a memory from the list
    const removeMemory = useCallback((memoryId) => {
        setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    }, []);

    // Toggle sidebar
    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    const value = {
        // Data
        chats,
        memories,
        projectId,
        project,
        sidebarOpen,

        // Chat actions
        addChat,
        updateChat,
        removeChat,
        updateChatActivity,

        // Memory actions
        addMemory,
        updateMemory,
        removeMemory,

        // UI actions
        toggleSidebar,
        setSidebarOpen,
    };

    return (
        <StudyModeContext.Provider value={value}>
            {children}
        </StudyModeContext.Provider>
    );
}

/**
 * Hook to access study mode context
 * @returns {Object} Study mode context value
 * @throws {Error} If used outside of StudyModeProvider
 */
export function useStudyMode() {
    const context = useContext(StudyModeContext);
    if (!context) {
        throw new Error('useStudyMode must be used within a StudyModeProvider');
    }
    return context;
}
