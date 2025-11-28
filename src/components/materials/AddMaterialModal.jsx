'use client';

import { useState } from 'react';
import { Modal, ModalBody, ModalFooter, Button, Input } from '@/components/ui';
import { addTextMaterial, addYouTubeMaterial, addLinkMaterial } from '@/actions';
import {
    FileText,
    Youtube,
    Link as LinkIcon,
    Upload,
    Image,
    Video,
} from 'lucide-react';

const MATERIAL_TYPES = [
    { id: 'text', label: 'Text Notes', icon: FileText, description: 'Add text content or notes' },
    { id: 'youtube', label: 'YouTube Video', icon: Youtube, description: 'Link a YouTube video' },
    { id: 'link', label: 'Web Link', icon: LinkIcon, description: 'Add a website or article' },
    { id: 'file', label: 'Upload File', icon: Upload, description: 'PDF, images, videos (coming soon)', disabled: true },
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

    const resetForm = () => {
        setSelectedType(null);
        setName('');
        setContent('');
        setUrl('');
        setDescription('');
        setError('');
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
