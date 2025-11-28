import { auth } from '@/auth';
import { StudyChat, Project } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * GET /api/study/chats?projectId={id}
 * List all chats for a project
 */
export async function GET(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return Response.json({ error: 'Project ID is required' }, { status: 400 });
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Fetch chats sorted by last activity
        const chats = await StudyChat.find({
            projectId,
            userId: session.user.id,
            status: 'active',
        })
            .sort({ lastActivityAt: -1 })
            .lean();

        // Transform for response
        const data = chats.map((chat) => ({
            id: chat._id.toString(),
            title: chat.title,
            messageCount: chat.messageCount,
            lastActivityAt: chat.lastActivityAt,
            status: chat.status,
            createdAt: chat.createdAt,
        }));

        return Response.json({ data });
    } catch (error) {
        console.error('[Study Chats] GET error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/study/chats
 * Create a new chat
 */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId, title } = await request.json();

        if (!projectId) {
            return Response.json({ error: 'Project ID is required' }, { status: 400 });
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Create the chat
        const chat = await StudyChat.create({
            projectId,
            userId: session.user.id,
            title: title || 'New Chat',
        });

        return Response.json({
            data: {
                id: chat._id.toString(),
                title: chat.title,
                projectId: chat.projectId.toString(),
                messageCount: chat.messageCount,
                lastActivityAt: chat.lastActivityAt,
                createdAt: chat.createdAt,
            },
        });
    } catch (error) {
        console.error('[Study Chats] POST error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
