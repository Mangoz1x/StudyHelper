import { auth } from '@/auth';
import { StudyMemory, Project } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * GET /api/study/memories?projectId={id}
 * Get all active memories for a project
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

        // Fetch active memories
        const memories = await StudyMemory.find({
            projectId,
            userId: session.user.id,
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .lean();

        // Transform for response
        const data = memories.map((memory) => ({
            id: memory._id.toString(),
            content: memory.content,
            category: memory.category,
            importance: memory.importance,
            sourceChatId: memory.sourceChatId?.toString() || null,
            createdAt: memory.createdAt,
            updatedAt: memory.updatedAt,
        }));

        return Response.json({ data });
    } catch (error) {
        console.error('[Study Memories] GET error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
