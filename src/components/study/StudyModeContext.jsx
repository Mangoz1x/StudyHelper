'use client';

import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Study Mode Context
 *
 * Provides shared state for the study mode interface:
 * - List of chats
 * - Project memories
 * - Project artifacts
 * - Sidebar state
 * - Artifact panel state
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
 * @param {Array} props.initialArtifacts - Initial list of artifacts
 * @param {string} props.projectId - Project ID
 * @param {Object} props.project - Full project object
 */
export function StudyModeProvider({
    children,
    initialChats = [],
    initialMemories = [],
    initialArtifacts = [],
    projectId,
    project,
}) {
    const [chats, setChats] = useState(initialChats);
    const [memories, setMemories] = useState(initialMemories);
    const [artifacts, setArtifacts] = useState(initialArtifacts);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Artifact panel state
    const [artifactPanelOpen, setArtifactPanelOpen] = useState(false);
    const [activeArtifactId, setActiveArtifactId] = useState(null);
    const [openArtifactTabs, setOpenArtifactTabs] = useState([]); // Array of artifact IDs

    // Text selection reference state
    const [textReference, setTextReference] = useState(null); // { text, artifactId, artifactTitle }

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

    // Add a new artifact
    const addArtifact = useCallback((artifact) => {
        setArtifacts((prev) => [artifact, ...prev]);
        // Open panel and add to tabs when artifact is created
        setArtifactPanelOpen(true);
        setOpenArtifactTabs((prev) =>
            prev.includes(artifact.id) ? prev : [...prev, artifact.id]
        );
        setActiveArtifactId(artifact.id);
    }, []);

    // Update an artifact
    const updateArtifact = useCallback((artifactId, updates) => {
        setArtifacts((prev) =>
            prev.map((a) => (a.id === artifactId ? { ...a, ...updates } : a))
        );
        // Switch to updated artifact tab if panel is open
        if (artifactPanelOpen) {
            setActiveArtifactId(artifactId);
            setOpenArtifactTabs((prev) =>
                prev.includes(artifactId) ? prev : [...prev, artifactId]
            );
        }
    }, [artifactPanelOpen]);

    // Remove an artifact from the list
    const removeArtifact = useCallback((artifactId) => {
        setArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
        setOpenArtifactTabs((prev) => prev.filter((id) => id !== artifactId));
        // If we're removing the active tab, switch to another
        setActiveArtifactId((prev) => {
            if (prev === artifactId) {
                const remaining = openArtifactTabs.filter((id) => id !== artifactId);
                return remaining.length > 0 ? remaining[remaining.length - 1] : null;
            }
            return prev;
        });
    }, [openArtifactTabs]);

    // Open artifact in panel
    const openArtifact = useCallback((artifactId) => {
        setArtifactPanelOpen(true);
        setActiveArtifactId(artifactId);
        setOpenArtifactTabs((prev) =>
            prev.includes(artifactId) ? prev : [...prev, artifactId]
        );
    }, []);

    // Close artifact tab
    const closeArtifactTab = useCallback((artifactId) => {
        setOpenArtifactTabs((prev) => prev.filter((id) => id !== artifactId));
        // If we're closing the active tab, switch to another
        setActiveArtifactId((prev) => {
            if (prev === artifactId) {
                const remaining = openArtifactTabs.filter((id) => id !== artifactId);
                return remaining.length > 0 ? remaining[remaining.length - 1] : null;
            }
            return prev;
        });
        // Close panel if no tabs left
        setOpenArtifactTabs((prev) => {
            if (prev.filter((id) => id !== artifactId).length === 0) {
                setArtifactPanelOpen(false);
            }
            return prev.filter((id) => id !== artifactId);
        });
    }, [openArtifactTabs]);

    // Toggle artifact panel
    const toggleArtifactPanel = useCallback(() => {
        setArtifactPanelOpen((prev) => !prev);
    }, []);

    // Toggle sidebar
    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    // Set text reference from artifact selection
    const setReference = useCallback((text, artifactId, artifactTitle) => {
        if (!text || text.trim().length === 0) {
            setTextReference(null);
            return;
        }
        setTextReference({
            text: text.trim(),
            artifactId,
            artifactTitle,
        });
    }, []);

    // Clear text reference
    const clearReference = useCallback(() => {
        setTextReference(null);
    }, []);

    const value = {
        // Data
        chats,
        memories,
        artifacts,
        projectId,
        project,
        sidebarOpen,

        // Artifact panel state
        artifactPanelOpen,
        activeArtifactId,
        openArtifactTabs,

        // Chat actions
        addChat,
        updateChat,
        removeChat,
        updateChatActivity,

        // Memory actions
        addMemory,
        updateMemory,
        removeMemory,

        // Artifact actions
        addArtifact,
        updateArtifact,
        removeArtifact,
        openArtifact,
        closeArtifactTab,
        setActiveArtifactId,
        toggleArtifactPanel,
        setArtifactPanelOpen,

        // UI actions
        toggleSidebar,
        setSidebarOpen,

        // Text reference
        textReference,
        setReference,
        clearReference,
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
