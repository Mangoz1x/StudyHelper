'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Sparkles } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { useStudyMode } from './StudyModeContext';
import { ArtifactPanel } from './artifacts';

/**
 * Study Chat Client Component
 *
 * Main chat interface for study mode with streaming support.
 *
 * @param {Object} props
 * @param {string} props.chatId - Current chat ID (null for new chat)
 * @param {Array} props.initialMessages - Initial messages to display
 */
export function StudyChatClient({ chatId, initialMessages = [] }) {
    const router = useRouter();
    const {
        projectId,
        project,
        addChat,
        updateChat,
        updateChatActivity,
        addMemory,
        addArtifact,
        updateArtifact,
        removeArtifact,
        artifactPanelOpen,
    } = useStudyMode();

    const [messages, setMessages] = useState(initialMessages);
    const [isStreaming, setIsStreaming] = useState(false);
    const [currentChatId, setCurrentChatId] = useState(chatId);

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Reset state when chatId prop changes (e.g., navigating to new chat or different chat)
    useEffect(() => {
        setMessages(initialMessages);
        setCurrentChatId(chatId);
        setIsStreaming(false);

        // Abort any in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, [chatId, initialMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handleSend = useCallback(
        async (content, attachments = []) => {
            if ((!content.trim() && attachments.length === 0) || isStreaming) return;

            // Add user message immediately
            const userMessage = {
                id: `temp-${Date.now()}`,
                role: 'user',
                content: content.trim(),
                attachments: attachments.map(f => ({
                    name: f.name,
                    type: f.type,
                    size: f.size,
                    preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                })),
                createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, userMessage]);

            // Add placeholder for assistant message
            const assistantMessageId = `assistant-${Date.now()}`;
            const assistantMessage = {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                createdAt: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsStreaming(true);

            // Create abort controller for this request
            abortControllerRef.current = new AbortController();

            try {
                let res;

                if (attachments.length > 0) {
                    // Use FormData for file uploads
                    const formData = new FormData();
                    formData.append('content', content.trim());
                    attachments.forEach((file, index) => {
                        formData.append(`file_${index}`, file);
                    });

                    res = await fetch(
                        `/api/study/chats/${currentChatId || 'new'}/messages?projectId=${projectId}`,
                        {
                            method: 'POST',
                            body: formData,
                            signal: abortControllerRef.current.signal,
                        }
                    );
                } else {
                    // Use JSON for text-only messages
                    res = await fetch(
                        `/api/study/chats/${currentChatId || 'new'}/messages?projectId=${projectId}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ content: content.trim() }),
                            signal: abortControllerRef.current.signal,
                        }
                    );
                }

                if (!res.ok) {
                    throw new Error('Failed to send message');
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();

                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Process complete SSE events
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);

                            if (data === '[DONE]') {
                                continue;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                handleStreamEvent(parsed, assistantMessageId);
                            } catch (e) {
                                // Ignore parse errors for incomplete data
                            }
                        }
                    }
                }
            } catch (error) {
                if (error.name === 'AbortError') {
                    console.log('Request aborted');
                } else {
                    console.error('Failed to send message:', error);
                    // Update assistant message with error flag
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? { ...m, content: '', isError: true }
                                : m
                        )
                    );
                }
            } finally {
                setIsStreaming(false);
                abortControllerRef.current = null;
            }
        },
        [currentChatId, projectId, isStreaming]
    );

    const handleStreamEvent = useCallback(
        (event, assistantMessageId) => {
            switch (event.type) {
                case 'chat_created':
                    // New chat was created, update state and URL
                    setCurrentChatId(event.chatId);
                    addChat({
                        id: event.chatId,
                        _id: event.chatId,
                        title: 'New Chat',
                        status: 'active',
                        messageCount: 0,
                        lastActivityAt: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                    });
                    // Update URL without full navigation
                    window.history.replaceState(
                        null,
                        '',
                        `/study/${projectId}/${event.chatId}`
                    );
                    break;

                case 'message_saved':
                    // User message was saved, update temp ID
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id.startsWith('temp-') && m.role === 'user'
                                ? { ...m, id: event.messageId, _id: event.messageId }
                                : m
                        )
                    );
                    break;

                case 'content':
                    // Append text to assistant message
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? { ...m, content: m.content + event.content }
                                : m
                        )
                    );
                    break;

                case 'tool_call':
                    // Add tool call to assistant message
                    const toolCall = {
                        name: event.tool,
                        args: event.data,
                        result: event.result,
                    };
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? {
                                      ...m,
                                      toolCalls: [...(m.toolCalls || []), toolCall],
                                  }
                                : m
                        )
                    );

                    // If it's a memory_create tool, update context with the new memory
                    if (event.tool === 'memory_create' && event.result) {
                        addMemory({
                            id: event.result.memoryId,
                            _id: event.result.memoryId,
                            content: event.data.content,
                            category: event.data.category || 'other',
                            createdAt: new Date().toISOString(),
                        });
                    }
                    break;

                case 'question':
                    // Add inline question to assistant message
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? { ...m, inlineQuestion: event.data }
                                : m
                        )
                    );
                    break;

                case 'message_complete':
                    // Update assistant message with final data
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? {
                                      ...m,
                                      id: event.messageId,
                                      _id: event.messageId,
                                  }
                                : m
                        )
                    );
                    // Update chat activity
                    if (currentChatId) {
                        updateChatActivity(currentChatId);
                    }
                    break;

                case 'chat_title_updated':
                    // Update chat title in sidebar
                    updateChat(event.chatId, { title: event.title });
                    break;

                case 'artifacts_creating':
                    // Show that artifacts are being created
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? {
                                      ...m,
                                      artifactsCreating: event.count,
                                  }
                                : m
                        )
                    );
                    break;

                case 'artifact_created':
                    // New artifact was created
                    addArtifact({
                        id: event.artifactId,
                        ...event.artifact,
                    });
                    // Add artifact action to message for display and clear creating state
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? {
                                      ...m,
                                      artifactsCreating: Math.max(0, (m.artifactsCreating || 1) - 1),
                                      artifactActions: [
                                          ...(m.artifactActions || []),
                                          {
                                              artifactId: event.artifactId,
                                              actionType: 'created',
                                              artifact: event.artifact,
                                          },
                                      ],
                                  }
                                : m
                        )
                    );
                    break;

                case 'artifact_updated':
                    // Artifact was updated
                    updateArtifact(event.artifactId, event.artifact);
                    // Add artifact action to message for display
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? {
                                      ...m,
                                      artifactActions: [
                                          ...(m.artifactActions || []),
                                          {
                                              artifactId: event.artifactId,
                                              actionType: 'updated',
                                              artifact: event.artifact,
                                          },
                                      ],
                                  }
                                : m
                        )
                    );
                    break;

                case 'artifact_deleted':
                    // Artifact was deleted
                    removeArtifact(event.artifactId);
                    // Add artifact action to message for display
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? {
                                      ...m,
                                      artifactActions: [
                                          ...(m.artifactActions || []),
                                          {
                                              artifactId: event.artifactId,
                                              actionType: 'deleted',
                                              artifact: { title: 'Deleted artifact' },
                                          },
                                      ],
                                  }
                                : m
                        )
                    );
                    break;

                case 'error':
                    console.error('Stream error:', event.message);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMessageId
                                ? {
                                      ...m,
                                      content: '',
                                      isError: true,
                                  }
                                : m
                        )
                    );
                    break;

                default:
                    // Unknown event type, ignore
                    break;
            }
        },
        [projectId, currentChatId, addChat, updateChat, updateChatActivity, addMemory, addArtifact, updateArtifact, removeArtifact]
    );

    const handleQuestionAnswer = useCallback((result) => {
        // Optionally handle question answer result
        console.log('Question answered:', result);
    }, []);

    const handleRetry = useCallback(
        (messageIndex) => {
            // Find the user message before the failed assistant message
            const userMessage = messages[messageIndex - 1];
            if (!userMessage || userMessage.role !== 'user') return;

            // Remove the failed assistant message
            setMessages((prev) => prev.filter((_, i) => i !== messageIndex));

            // Resend the user message
            handleSend(userMessage.content, userMessage.attachments || []);
        },
        [messages, handleSend]
    );

    // Empty state for new chat
    if (messages.length === 0 && !isStreaming) {
        return (
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center max-w-lg">
                        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-violet-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Ready to Study
                        </h2>
                        <p className="text-gray-600 mb-6">
                            I&apos;m your AI study assistant. I have access to all your project
                            materials and can help you understand concepts, answer questions,
                            and quiz you on the content.
                        </p>
                        <div className="grid grid-cols-2 gap-3 text-left">
                            <SuggestionCard
                                icon={<BookOpen className="w-4 h-4" />}
                                text="Explain the main concepts"
                                onClick={() => handleSend('Can you explain the main concepts from my study materials?')}
                            />
                            <SuggestionCard
                                icon={<Sparkles className="w-4 h-4" />}
                                text="Quiz me on this topic"
                                onClick={() => handleSend('Can you quiz me on the material to test my understanding?')}
                            />
                        </div>
                    </div>
                </div>

                <ChatInput onSend={handleSend} disabled={isStreaming} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex h-full">
            {/* Main chat area */}
            <div className={`flex flex-col h-full bg-white transition-all ${artifactPanelOpen ? 'w-1/2' : 'w-full'}`}>
                {/* Messages area */}
                <div className="flex-1 overflow-y-auto">
                    <div className={`mx-auto space-y-6 px-4 py-6 pb-4 ${artifactPanelOpen ? 'max-w-2xl' : 'max-w-3xl'}`}>
                        {messages.map((message, index) => (
                            <MessageBubble
                                key={message.id || message._id || index}
                                message={message}
                                isStreaming={
                                    isStreaming &&
                                    index === messages.length - 1 &&
                                    message.role === 'assistant'
                                }
                                onQuestionAnswer={handleQuestionAnswer}
                                onRetry={message.isError ? () => handleRetry(index) : undefined}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input area */}
                <ChatInput onSend={handleSend} disabled={isStreaming} />
            </div>

            {/* Artifact side panel */}
            <ArtifactPanel />
        </div>
    );
}

/**
 * Suggestion Card Component
 */
function SuggestionCard({ icon, text, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors text-left"
        >
            <span className="text-violet-600">{icon}</span>
            <span className="text-sm text-gray-700">{text}</span>
        </button>
    );
}
