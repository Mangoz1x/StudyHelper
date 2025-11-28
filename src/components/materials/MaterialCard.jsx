'use client';

import { useState } from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { deleteMaterial } from '@/actions';
import {
    FileText,
    Youtube,
    Link as LinkIcon,
    Image,
    Video,
    File,
    Music,
    MoreVertical,
    Trash2,
    ExternalLink,
    Loader2,
    CheckCircle,
    AlertCircle,
    Clock,
    MessageSquare,
} from 'lucide-react';

const TYPE_ICONS = {
    text: FileText,
    youtube: Youtube,
    link: LinkIcon,
    image: Image,
    video: Video,
    pdf: File,
    audio: Music,
};

const STATUS_STYLES = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    processing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', spin: true },
    ready: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

/**
 * Material Card Component
 */
export function MaterialCard({ material, onDeleted }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const IconComponent = TYPE_ICONS[material.type] || File;
    const statusStyle = STATUS_STYLES[material.status] || STATUS_STYLES.pending;
    const StatusIcon = statusStyle.icon;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this material?')) return;

        setDeleting(true);
        const result = await deleteMaterial(material.id);
        setDeleting(false);

        if (result.success) {
            onDeleted?.(material.id);
        }
    };

    const getExternalUrl = () => {
        if (material.type === 'youtube') {
            return material.youtube?.url;
        }
        if (material.type === 'link') {
            return material.link?.url;
        }
        return null;
    };

    const externalUrl = getExternalUrl();

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardContent>
                <div className="flex items-start gap-4">
                    {/* Icon / Thumbnail */}
                    <div className="flex-shrink-0">
                        {material.type === 'youtube' && material.youtube?.thumbnailUrl ? (
                            <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={material.youtube.thumbnailUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        ) : material.type === 'image' && material.file?.gridfsId ? (
                            <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100">
                                <img
                                    src={`/api/files/${material.file.gridfsId}`}
                                    alt={material.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                    }}
                                />
                            </div>
                        ) : material.type === 'video' && material.file?.gridfsId ? (
                            <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center relative">
                                <Video className="w-6 h-6 text-white/70" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-0.5" />
                                    </div>
                                </div>
                            </div>
                        ) : material.type === 'pdf' && material.file?.gridfsId ? (
                            <div className="w-20 h-12 rounded-lg overflow-hidden bg-red-50 flex items-center justify-center">
                                <File className="w-6 h-6 text-red-500" />
                            </div>
                        ) : material.type === 'audio' && material.file?.gridfsId ? (
                            <div className="w-20 h-12 rounded-lg overflow-hidden bg-purple-50 flex items-center justify-center">
                                <Music className="w-6 h-6 text-purple-500" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                <IconComponent className="w-5 h-5 text-gray-500" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">
                                    {material.name}
                                </h4>
                                {material.description && (
                                    <p className="text-sm text-gray-500 line-clamp-1">
                                        {material.description}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {externalUrl && (
                                    <a
                                        href={externalUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    {deleting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Status & Meta */}
                        <div className="flex items-center gap-3 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                                <StatusIcon className={`w-3 h-3 ${statusStyle.spin ? 'animate-spin' : ''}`} />
                                {material.status}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                                {material.type}
                            </span>
                            {material.scope === 'study_mode' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-600">
                                    <MessageSquare className="w-3 h-3" />
                                    Study Only
                                </span>
                            )}
                        </div>

                        {/* Summary preview */}
                        {material.summary && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                {material.summary}
                            </p>
                        )}

                        {/* Topics */}
                        {material.topics && material.topics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {material.topics.slice(0, 5).map((topic, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                                    >
                                        {topic}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Processing error */}
                        {material.processingError && (
                            <p className="mt-2 text-sm text-red-600">
                                Error: {material.processingError}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
