'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Plus, Paperclip, X, FileText, Film, FileAudio, Image as ImageIcon, Quote } from 'lucide-react';
import { useStudyMode } from './StudyModeContext';

/**
 * Chat Input Component
 *
 * Modern chat input with attachment button, similar to ChatGPT/Gemini.
 *
 * @param {Object} props
 * @param {Function} props.onSend - Callback when message is sent
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.placeholder - Input placeholder text
 */
export function ChatInput({
    onSend,
    disabled = false,
    placeholder = 'Ask anything...',
}) {
    const { textReference, clearReference } = useStudyMode();
    const [value, setValue] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const textareaRef = useRef(null);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
    }, [value]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowAttachMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setAttachments(prev => [...prev, ...files]);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setShowAttachMenu(false);
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (file) => {
        const type = file.type;
        if (type.startsWith('image/')) return ImageIcon;
        if (type.startsWith('video/')) return Film;
        if (type.startsWith('audio/')) return FileAudio;
        return FileText;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        const hasContent = value.trim().length > 0;
        const hasAttachments = attachments.length > 0;
        const hasReference = !!textReference;

        if ((!hasContent && !hasAttachments && !hasReference) || disabled) return;

        // Include reference in message if present
        let messageContent = value.trim();
        if (textReference) {
            const refPrefix = `[Referencing from "${textReference.artifactTitle}"]: "${textReference.text}"\n\n`;
            messageContent = refPrefix + messageContent;
        }

        onSend?.(messageContent, attachments);
        setValue('');
        setAttachments([]);
        clearReference();

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const hasContent = value.trim().length > 0 || attachments.length > 0 || !!textReference;

    return (
        <div className="p-4 bg-gradient-to-t from-white via-white to-transparent pt-6">
            <div className="max-w-3xl mx-auto">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="application/pdf,image/*,video/*,audio/*,text/*,.txt,.md,.markdown,.json,.csv,.xml,.html,.htm,.js,.jsx,.ts,.tsx,.css,.py,.java,.c,.cpp,.h,.hpp,.rb,.go,.rs,.swift,.kt"
                    multiple
                    className="hidden"
                />

                <form onSubmit={handleSubmit}>
                    <div className="bg-gray-100 rounded-2xl border border-gray-200 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                        {/* Text reference preview */}
                        {textReference && (
                            <div className="px-3 pt-3">
                                <div className="relative group flex items-start gap-2 px-3 py-2 bg-violet-50 rounded-lg border border-violet-200 max-w-full">
                                    <div className="w-8 h-8 rounded bg-violet-100 flex items-center justify-center flex-shrink-0">
                                        <Quote className="w-4 h-4 text-violet-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-violet-700 mb-0.5">
                                            Referencing from {textReference.artifactTitle}
                                        </p>
                                        <p className="text-sm text-gray-700 line-clamp-2">
                                            &ldquo;{textReference.text}&rdquo;
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={clearReference}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Attachment previews */}
                        {attachments.length > 0 && (
                            <div className="px-3 pt-3 flex flex-wrap gap-2">
                                {attachments.map((file, index) => {
                                    const FileIcon = getFileIcon(file);
                                    const isImage = file.type.startsWith('image/');
                                    return (
                                        <div
                                            key={`${file.name}-${index}`}
                                            className="relative group flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 max-w-[200px]"
                                        >
                                            {isImage ? (
                                                <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                    <img
                                                        src={URL.createObjectURL(file)}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded bg-violet-100 flex items-center justify-center flex-shrink-0">
                                                    <FileIcon className="w-4 h-4 text-violet-600" />
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-gray-700 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="relative flex items-end gap-2">
                            {/* Attach button */}
                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setShowAttachMenu(!showAttachMenu)}
                                    className="flex-shrink-0 w-10 h-10 m-1 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>

                                {/* Attachment menu */}
                                {showAttachMenu && (
                                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Paperclip className="w-4 h-4" />
                                            Add photos & files
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Text input */}
                            <textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={disabled}
                                placeholder={placeholder}
                                rows={1}
                                className="flex-1 bg-transparent py-3 pr-2 resize-none text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{ minHeight: '24px', maxHeight: '200px' }}
                            />

                            {/* Send button */}
                            <button
                                type="submit"
                                disabled={!hasContent || disabled}
                                className={`flex-shrink-0 w-10 h-10 m-1 rounded-xl flex items-center justify-center transition-all ${
                                    hasContent && !disabled
                                        ? 'bg-violet-600 text-white hover:bg-violet-700'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {disabled ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <p className="text-xs text-gray-400 text-center mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}
