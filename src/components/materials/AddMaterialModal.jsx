'use client';

import { useState, useRef } from 'react';
import { Modal, ModalBody, ModalFooter, Button, Input } from '@/components/ui';
import { addTextMaterial, addYouTubeMaterial, addLinkMaterial } from '@/actions';
import {
    FileText,
    Youtube,
    Link as LinkIcon,
    Upload,
    Film,
    FileAudio,
    Info,
    X,
} from 'lucide-react';

const MATERIAL_TYPES = [
    { id: 'text', label: 'Text Notes', icon: FileText, description: 'Add text content or notes' },
    { id: 'youtube', label: 'YouTube Video', icon: Youtube, description: 'Link a YouTube video' },
    { id: 'link', label: 'Web Link', icon: LinkIcon, description: 'Add a website or article' },
    { id: 'file', label: 'Upload File', icon: Upload, description: 'PDF, images, audio, or video files' },
];

const VIDEO_MODES = [
    {
        id: 'full',
        label: 'Full Video Analysis',
        icon: Film,
        description: 'Send the entire video to AI for analysis (better for visual content)',
    },
    {
        id: 'transcript',
        label: 'Transcript Only',
        icon: FileAudio,
        description: 'Extract audio transcript (faster, uses less resources)',
    },
];

/**
 * Add Material Modal
 */
export function AddMaterialModal({ open, onClose, projectId, onMaterialAdded }) {
    const [selectedType, setSelectedType] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const [description, setDescription] = useState('');

    // File upload
    const [file, setFile] = useState(null);
    const fileInputRef = useRef(null);

    // Video mode (full video or transcript only)
    const [videoMode, setVideoMode] = useState('full');

    const resetForm = () => {
        setSelectedType(null);
        setName('');
        setContent('');
        setUrl('');
        setDescription('');
        setFile(null);
        setVideoMode('full');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Check if file is video or audio
    const isMediaFile = file && (file.type.startsWith('video/') || file.type.startsWith('audio/'));

    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Reset video mode when file changes
            setVideoMode('full');
        }
    };

    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const handleClose = () => {
        if (!loading) {
            resetForm();
            onClose();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        let result;

        switch (selectedType) {
            case 'text':
                result = await addTextMaterial({
                    projectId,
                    name,
                    content,
                    description,
                });
                break;
            case 'youtube':
                result = await addYouTubeMaterial({
                    projectId,
                    url,
                    name,
                    description,
                    transcriptOnly: videoMode === 'transcript',
                });
                break;
            case 'link':
                result = await addLinkMaterial({
                    projectId,
                    url,
                    name,
                    description,
                });
                break;
            case 'file':
                if (!file) {
                    setError('Please select a file');
                    setLoading(false);
                    return;
                }

                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('projectId', projectId);
                    if (name) formData.append('name', name);
                    if (description) formData.append('description', description);
                    if (isMediaFile && videoMode === 'transcript') {
                        formData.append('transcriptOnly', 'true');
                    }

                    const response = await fetch('/api/materials/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    result = await response.json();
                } catch (err) {
                    result = { error: 'Failed to upload file. Please try again.' };
                }
                break;
            default:
                setError('Please select a material type');
                setLoading(false);
                return;
        }

        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        resetForm();
        onClose();
        onMaterialAdded?.(result.data);
    };

    const renderForm = () => {
        switch (selectedType) {
            case 'text':
                return (
                    <div className="space-y-4">
                        <Input
                            label="Title"
                            placeholder="e.g., Chapter 1 Notes"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Content
                            </label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter your notes or text content..."
                                rows={8}
                                required
                                className="block w-full rounded-lg border border-gray-300
                                         bg-white px-4 py-2.5 text-gray-900
                                         placeholder:text-gray-400
                                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                         transition-colors duration-150 resize-none"
                            />
                        </div>
                        <Input
                            label="Description (optional)"
                            placeholder="Brief description of this material"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                );

            case 'youtube':
                return (
                    <div className="space-y-4">
                        <Input
                            label="YouTube URL"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />

                        {/* Video Mode Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Processing Mode
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {VIDEO_MODES.map((mode) => (
                                    <button
                                        key={mode.id}
                                        type="button"
                                        onClick={() => setVideoMode(mode.id)}
                                        className={`
                                            p-3 rounded-lg border-2 text-left transition-all
                                            ${videoMode === mode.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <mode.icon className={`w-4 h-4 ${videoMode === mode.id ? 'text-blue-600' : 'text-gray-500'}`} />
                                            <span className={`text-sm font-medium ${videoMode === mode.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {mode.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-tight">
                                            {mode.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            {videoMode === 'transcript' && (
                                <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                                    <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-700">
                                        Transcript will be extracted from YouTube captions if available.
                                        This is faster but won&apos;t analyze visual content.
                                    </p>
                                </div>
                            )}
                        </div>

                        <Input
                            label="Custom Title (optional)"
                            placeholder="Leave empty to use video title"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            label="Description (optional)"
                            placeholder="Brief description of this video"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                );

            case 'link':
                return (
                    <div className="space-y-4">
                        <Input
                            label="URL"
                            placeholder="https://example.com/article"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            required
                        />
                        <Input
                            label="Title"
                            placeholder="Name for this link"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            label="Description (optional)"
                            placeholder="Brief description of this resource"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                );

            case 'file':
                return (
                    <div className="space-y-4">
                        {/* File Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select File
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileChange}
                                accept="application/pdf,image/*,video/*,audio/*"
                                className="hidden"
                            />
                            {!file ? (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full p-8 border-2 border-dashed border-gray-300 rounded-lg
                                             hover:border-blue-500 hover:bg-blue-50 transition-all
                                             flex flex-col items-center justify-center gap-2"
                                >
                                    <Upload className="w-8 h-8 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        Click to select a file
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        PDF, images, audio, or video files
                                    </span>
                                </button>
                            ) : (
                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                {file.type.startsWith('video/') ? (
                                                    <Film className="w-5 h-5 text-blue-600" />
                                                ) : file.type.startsWith('audio/') ? (
                                                    <FileAudio className="w-5 h-5 text-blue-600" />
                                                ) : (
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={clearFile}
                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Video Mode Selection (only for video/audio files) */}
                        {isMediaFile && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Processing Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {VIDEO_MODES.map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setVideoMode(mode.id)}
                                            className={`
                                                p-3 rounded-lg border-2 text-left transition-all
                                                ${videoMode === mode.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <mode.icon className={`w-4 h-4 ${videoMode === mode.id ? 'text-blue-600' : 'text-gray-500'}`} />
                                                <span className={`text-sm font-medium ${videoMode === mode.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {mode.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 leading-tight">
                                                {mode.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                                {videoMode === 'transcript' && (
                                    <div className="mt-2 flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                                        <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-700">
                                            Audio will be transcribed using Whisper AI.
                                            This is faster but won&apos;t analyze visual content.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <Input
                            label="Custom Name (optional)"
                            placeholder="Leave empty to use filename"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <Input
                            label="Description (optional)"
                            placeholder="Brief description of this file"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={selectedType ? 'Add Material' : 'Select Material Type'}
            size="lg"
        >
            {!selectedType ? (
                <>
                    <ModalBody>
                        <div className="grid grid-cols-2 gap-3">
                            {MATERIAL_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => !type.disabled && setSelectedType(type.id)}
                                    disabled={type.disabled}
                                    className={`
                                        p-4 rounded-xl border-2 text-left transition-all
                                        ${type.disabled
                                            ? 'opacity-50 cursor-not-allowed border-gray-200'
                                            : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                                        }
                                    `}
                                >
                                    <type.icon className="w-6 h-6 text-blue-600 mb-2" />
                                    <p className="font-medium text-gray-900">
                                        {type.label}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {type.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </>
            ) : (
                <form onSubmit={handleSubmit}>
                    <ModalBody>
                        {/* Back button */}
                        <button
                            type="button"
                            onClick={() => setSelectedType(null)}
                            className="text-sm text-blue-600 hover:underline mb-4"
                        >
                            &larr; Back to material types
                        </button>

                        {renderForm()}

                        {error && (
                            <p className="mt-4 text-sm text-red-600">{error}</p>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" loading={loading}>
                            Add Material
                        </Button>
                    </ModalFooter>
                </form>
            )}
        </Modal>
    );
}
