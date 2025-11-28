'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import {
    Book,
    GraduationCap,
    Beaker,
    Calculator,
    Globe,
    Code,
    Palette,
    Music,
    FileText,
    ClipboardList,
    MoreVertical,
} from 'lucide-react';

const ICON_MAP = {
    book: Book,
    'graduation-cap': GraduationCap,
    beaker: Beaker,
    calculator: Calculator,
    globe: Globe,
    code: Code,
    palette: Palette,
    music: Music,
};

/**
 * Project Card Component
 */
export function ProjectCard({ project }) {
    const IconComponent = ICON_MAP[project.icon] || Book;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <Link href={`/dashboard/projects/${project.id}`}>
            <Card variant="interactive" className="h-full group">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: project.color }}
                        >
                            <IconComponent className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {project.name}
                    </h3>

                    {project.description && (
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                            {project.description}
                        </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            <span>{project.stats?.materialCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4" />
                            <span>{project.stats?.assessmentCount || 0}</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                            {formatDate(project.createdAt)}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
