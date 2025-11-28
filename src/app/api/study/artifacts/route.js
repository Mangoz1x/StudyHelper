import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Artifact, Project } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * GET /api/study/artifacts
 *
 * List artifacts for a project
 *
 * Query params:
 * - projectId: string (required)
 * - status: 'active' | 'archived' (optional, default: 'active')
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const status = searchParams.get('status') || 'active';

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Fetch artifacts
        const artifacts = await Artifact.find({
            projectId,
            userId: session.user.id,
            status,
        })
            .sort({ updatedAt: -1 })
            .lean();

        return NextResponse.json({
            data: artifacts.map((a) => ({
                ...a,
                id: a._id.toString(),
                _id: a._id.toString(),
                chatId: a.chatId?.toString(),
                projectId: a.projectId?.toString(),
            })),
        });
    } catch (error) {
        console.error('[Artifacts] List error:', error);
        return NextResponse.json({ error: 'Failed to fetch artifacts' }, { status: 500 });
    }
}

/**
 * POST /api/study/artifacts
 *
 * Create a new artifact (typically called from tool execution)
 */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { projectId, chatId, type, title, description, content, sourceMessageId } = body;

        if (!projectId || !chatId || !type || !title) {
            return NextResponse.json(
                { error: 'projectId, chatId, type, and title are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // Create artifact
        const artifact = await Artifact.create({
            projectId,
            chatId,
            userId: session.user.id,
            type,
            title,
            description,
            content: content || {},
            status: 'active',
            sourceMessageId,
        });

        return NextResponse.json({
            data: {
                id: artifact._id.toString(),
                _id: artifact._id.toString(),
                type: artifact.type,
                title: artifact.title,
                description: artifact.description,
                content: artifact.content,
                status: artifact.status,
                createdAt: artifact.createdAt,
                updatedAt: artifact.updatedAt,
            },
        });
    } catch (error) {
        console.error('[Artifacts] Create error:', error);
        return NextResponse.json({ error: 'Failed to create artifact' }, { status: 500 });
    }
}
