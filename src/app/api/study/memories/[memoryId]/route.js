import { auth } from '@/auth';
import { StudyMemory } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * PATCH /api/study/memories/[memoryId]
 * Update a memory (content, category, or deactivate)
 */
export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { memoryId } = await params;
        const updates = await request.json();

        await connectDB();

        // Verify ownership
        const memory = await StudyMemory.findOne({
            _id: memoryId,
            userId: session.user.id,
        });

        if (!memory) {
            return Response.json({ error: 'Memory not found' }, { status: 404 });
        }

        // Only allow updating specific fields
        const allowedUpdates = {};
        if (updates.content !== undefined) {
            allowedUpdates.content = updates.content;
        }
        if (updates.category !== undefined) {
            allowedUpdates.category = updates.category;
        }
        if (updates.importance !== undefined) {
            allowedUpdates.importance = Math.min(5, Math.max(1, updates.importance));
        }
        if (updates.isActive !== undefined) {
            allowedUpdates.isActive = updates.isActive;
        }

        const updatedMemory = await StudyMemory.findByIdAndUpdate(
            memoryId,
            { $set: allowedUpdates },
            { new: true }
        ).lean();

        return Response.json({
            data: {
                id: updatedMemory._id.toString(),
                content: updatedMemory.content,
                category: updatedMemory.category,
                importance: updatedMemory.importance,
                isActive: updatedMemory.isActive,
                updatedAt: updatedMemory.updatedAt,
            },
        });
    } catch (error) {
        console.error('[Study Memory] PATCH error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/study/memories/[memoryId]
 * Hard delete a memory
 */
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { memoryId } = await params;
        await connectDB();

        // Verify ownership and delete
        const result = await StudyMemory.deleteOne({
            _id: memoryId,
            userId: session.user.id,
        });

        if (result.deletedCount === 0) {
            return Response.json({ error: 'Memory not found' }, { status: 404 });
        }

        return Response.json({ success: true });
    } catch (error) {
        console.error('[Study Memory] DELETE error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
