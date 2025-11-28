'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalBody, ModalFooter, Button, Input } from '@/components/ui';
import { createProject } from '@/actions';
import {
    Book,
    GraduationCap,
    Beaker,
    Calculator,
    Globe,
    Code,
    Palette,
    Music,
} from 'lucide-react';

const PROJECT_ICONS = [
    { name: 'book', icon: Book },
    { name: 'graduation-cap', icon: GraduationCap },
    { name: 'beaker', icon: Beaker },
    { name: 'calculator', icon: Calculator },
    { name: 'globe', icon: Globe },
    { name: 'code', icon: Code },
    { name: 'palette', icon: Palette },
    { name: 'music', icon: Music },
];

const PROJECT_COLORS = [
    '#2563eb', // Blue
    '#7c3aed', // Violet
    '#db2777', // Pink
    '#dc2626', // Red
    '#ea580c', // Orange
    '#16a34a', // Green
    '#0891b2', // Cyan
    '#4b5563', // Gray
];

/**
 * Create Project Modal
 */
export function CreateProjectModal({ open, onClose }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('book');
    const [selectedColor, setSelectedColor] = useState('#2563eb');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await createProject({
            name,
            description,
            icon: selectedIcon,
            color: selectedColor,
        });

        setLoading(false);

        if (result.error) {
            setError(result.error);
            return;
        }

        // Reset form
        setName('');
        setDescription('');
        setSelectedIcon('book');
        setSelectedColor('#2563eb');

        onClose();
        router.push(`/dashboard/projects/${result.data.id}`);
    };

    const handleClose = () => {
        if (!loading) {
            setName('');
            setDescription('');
            setError('');
            onClose();
        }
    };

    const SelectedIconComponent = PROJECT_ICONS.find(i => i.name === selectedIcon)?.icon || Book;

    return (
        <Modal open={open} onClose={handleClose} title="Create New Project" size="md">
            <form onSubmit={handleSubmit}>
                <ModalBody className="space-y-6">
                    {/* Preview */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: selectedColor }}
                        >
                            <SelectedIconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">
                                {name || 'Project Name'}
                            </p>
                            <p className="text-sm text-gray-500">
                                {description || 'No description'}
                            </p>
                        </div>
                    </div>

                    {/* Name */}
                    <Input
                        label="Project Name"
                        placeholder="e.g., Biology 101, Machine Learning Course"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={100}
                    />

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this project about?"
                            maxLength={500}
                            rows={3}
                            className="block w-full rounded-lg border border-gray-300
                                     bg-white px-4 py-2.5 text-gray-900
                                     placeholder:text-gray-400
                                     focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                     transition-colors duration-150 resize-none"
                        />
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Icon
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PROJECT_ICONS.map(({ name, icon: Icon }) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setSelectedIcon(name)}
                                    className={`p-2.5 rounded-lg border-2 transition-all ${
                                        selectedIcon === name
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${
                                        selectedIcon === name
                                            ? 'text-blue-600'
                                            : 'text-gray-500'
                                    }`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PROJECT_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full transition-all ${
                                        selectedColor === color
                                            ? 'ring-2 ring-offset-2 ring-blue-500'
                                            : 'hover:scale-110'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
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
                    <Button
                        type="submit"
                        loading={loading}
                        disabled={!name.trim()}
                    >
                        Create Project
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
