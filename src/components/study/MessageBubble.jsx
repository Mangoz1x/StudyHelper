'use client';

import { useState } from 'react';
import { User, Bot, Copy, Check, ChevronDown, ChevronUp, FileText, Film, FileAudio, Image as ImageIcon, RotateCcw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { InlineQuestion } from './InlineQuestion';

/**
 * Get icon for file type
 */
function getFileIcon(mimeType) {
    if (mimeType?.startsWith('image/')) return ImageIcon;
    if (mimeType?.startsWith('video/')) return Film;
    if (mimeType?.startsWith('audio/')) return FileAudio;
    return FileText;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * User Message Bubble
 *
 * Displays a message from the user.
 *
 * @param {Object} props
 * @param {Object} props.message - The message object
 */
export function UserMessage({ message }) {
    const hasAttachments = message.attachments && message.attachments.length > 0;
    const hasContent = message.content && message.content.trim().length > 0;

    return (
        <div className="flex gap-3 justify-end">
            <div className="max-w-[80%]">
                {/* Attachments */}
                {hasAttachments && (
                    <div className="flex flex-wrap gap-2 justify-end mb-2">
                        {message.attachments.map((attachment, index) => {
                            const FileIcon = getFileIcon(attachment.mimeType || attachment.type);
                            const isImage = (attachment.mimeType || attachment.type)?.startsWith('image/');

                            return (
                                <div
                                    key={`${attachment.name}-${index}`}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg max-w-[200px]"
                                >
                                    {isImage && attachment.preview ? (
                                        <div className="w-8 h-8 rounded overflow-hidden bg-blue-400 flex-shrink-0">
                                            <img
                                                src={attachment.preview}
                                                alt={attachment.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-blue-400 flex items-center justify-center flex-shrink-0">
                                            <FileIcon className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium truncate">
                                            {attachment.name}
                                        </p>
                                        {attachment.size && (
                                            <p className="text-xs text-blue-200">
                                                {formatFileSize(attachment.size)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Text content */}
                {hasContent && (
                    <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-1 text-right">
                    {formatTime(message.createdAt)}
                </p>
            </div>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
            </div>
        </div>
    );
}

/**
 * Assistant Message Bubble
 *
 * Displays a message from the AI assistant with markdown support,
 * inline questions, and copy functionality.
 *
 * @param {Object} props
 * @param {Object} props.message - The message object
 * @param {boolean} props.isStreaming - Whether the message is currently streaming
 * @param {boolean} props.isError - Whether the message encountered an error
 * @param {Function} props.onRetry - Callback to retry the message
 * @param {Function} props.onQuestionAnswer - Callback when an inline question is answered
 */
export function AssistantMessage({ message, isStreaming = false, isError = false, onRetry, onQuestionAnswer }) {
    const [copied, setCopied] = useState(false);
    const [showToolCalls, setShowToolCalls] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;
    const hasInlineQuestion = message.inlineQuestion;
    const hasContent = message.content && message.content.trim().length > 0;
    const isErrorMessage = isError || message.isError;
    const showMessageBubble = hasContent || isStreaming || isErrorMessage;

    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-600" />
            </div>
            <div className="flex-1 max-w-[85%]">
                {/* Main content - only show bubble if there's content or streaming */}
                {showMessageBubble && (
                    <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${isErrorMessage ? 'bg-red-50' : 'bg-gray-100'}`}>
                        {isErrorMessage ? (
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm">Something went wrong. Please try again.</span>
                                </div>
                                {onRetry && (
                                    <button
                                        onClick={onRetry}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Retry
                                    </button>
                                )}
                            </div>
                        ) : hasContent ? (
                            <div className="markdown-content text-gray-900">
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                        li: ({ children }) => <li className="ml-2">{children}</li>,
                                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                        em: ({ children }) => <em className="italic">{children}</em>,
                                        code: ({ inline, children }) =>
                                            inline ? (
                                                <code className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                                            ) : (
                                                <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-3">{children}</code>
                                            ),
                                        pre: ({ children }) => <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto my-3">{children}</pre>,
                                        blockquote: ({ children }) => <blockquote className="border-l-4 border-violet-300 pl-4 italic my-3 text-gray-600">{children}</blockquote>,
                                        a: ({ href, children }) => <a href={href} className="text-violet-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                        hr: () => <hr className="my-4 border-gray-300" />,
                                    }}
                                >
                                    {message.content}
                                </ReactMarkdown>
                            </div>
                        ) : isStreaming ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-sm">Thinking...</span>
                            </div>
                        ) : null}

                        {/* Streaming cursor */}
                        {isStreaming && hasContent && (
                            <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-0.5" />
                        )}
                    </div>
                )}

                {/* Inline Question */}
                {hasInlineQuestion && (
                    <InlineQuestion
                        question={message.inlineQuestion}
                        messageId={message.id || message._id}
                        onAnswer={onQuestionAnswer}
                    />
                )}

                {/* Tool calls indicator */}
                {hasToolCalls && (
                    <div className="mt-2">
                        <button
                            onClick={() => setShowToolCalls(!showToolCalls)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                        >
                            {showToolCalls ? (
                                <ChevronUp className="w-3 h-3" />
                            ) : (
                                <ChevronDown className="w-3 h-3" />
                            )}
                            {message.toolCalls.length} action{message.toolCalls.length !== 1 ? 's' : ''} taken
                        </button>
                        {showToolCalls && (
                            <div className="mt-2 space-y-1">
                                {message.toolCalls.map((tool, idx) => (
                                    <ToolCallBadge key={idx} toolCall={tool} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer with timestamp and copy */}
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-400">
                        {formatTime(message.createdAt)}
                    </p>
                    {!isStreaming && message.content && (
                        <button
                            onClick={handleCopy}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy message"
                        >
                            {copied ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Tool Call Badge
 *
 * Displays a small badge for a tool call action.
 */
function ToolCallBadge({ toolCall }) {
    const toolLabels = {
        memory_create: 'Created memory',
        memory_update: 'Updated memory',
        memory_delete: 'Removed memory',
        question_create: 'Created question',
    };

    const toolColors = {
        memory_create: 'bg-green-100 text-green-700',
        memory_update: 'bg-blue-100 text-blue-700',
        memory_delete: 'bg-red-100 text-red-700',
        question_create: 'bg-violet-100 text-violet-700',
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                toolColors[toolCall.name] || 'bg-gray-100 text-gray-700'
            }`}
        >
            {toolLabels[toolCall.name] || toolCall.name}
        </span>
    );
}

/**
 * Generic Message Bubble
 *
 * Automatically renders the correct bubble type based on message role.
 *
 * @param {Object} props
 * @param {Object} props.message - The message object
 * @param {boolean} props.isStreaming - Whether the message is currently streaming
 * @param {Function} props.onQuestionAnswer - Callback when an inline question is answered
 * @param {Function} props.onRetry - Callback to retry a failed message
 */
export function MessageBubble({ message, isStreaming = false, onQuestionAnswer, onRetry }) {
    if (message.role === 'user') {
        return <UserMessage message={message} />;
    }

    return (
        <AssistantMessage
            message={message}
            isStreaming={isStreaming}
            onQuestionAnswer={onQuestionAnswer}
            onRetry={onRetry}
        />
    );
}

/**
 * Format timestamp for display
 */
function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
