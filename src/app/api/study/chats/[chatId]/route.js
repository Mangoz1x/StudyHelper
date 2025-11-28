import { auth } from '@/auth';
import { StudyChat, StudyMessage } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * GET /api/study/chats/[chatId]
 * Get a single chat with its details
 */
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        await connectDB();

        const chat = await StudyChat.findOne({
            _id: chatId,
            userId: session.user.id,
        }).lean();

        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        return Response.json({
            data: {
                id: chat._id.toString(),
                projectId: chat.projectId.toString(),
                title: chat.title,
                status: chat.status,
                messageCount: chat.messageCount,
                lastActivityAt: chat.lastActivityAt,
                createdAt: chat.createdAt,
            },
        });
    } catch (error) {
        console.error('[Study Chat] GET error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/study/chats/[chatId]
 * Update a chat (rename, archive)
 */
export async function PATCH(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        const updates = await request.json();

        await connectDB();

        // Verify ownership
        const chat = await StudyChat.findOne({
            _id: chatId,
            userId: session.user.id,
        });

        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Only allow updating specific fields
        const allowedUpdates = {};
        if (updates.title !== undefined) {
            allowedUpdates.title = updates.title;
        }
        if (updates.status !== undefined && ['active', 'archived'].includes(updates.status)) {
            allowedUpdates.status = updates.status;
        }

        const updatedChat = await StudyChat.findByIdAndUpdate(
            chatId,
            { $set: allowedUpdates },
            { new: true }
        ).lean();

        return Response.json({
            data: {
                id: updatedChat._id.toString(),
                title: updatedChat.title,
                status: updatedChat.status,
                messageCount: updatedChat.messageCount,
                lastActivityAt: updatedChat.lastActivityAt,
            },
        });
    } catch (error) {
        console.error('[Study Chat] PATCH error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/study/chats/[chatId]
 * Delete a chat and all its messages
 */
export async function DELETE(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        await connectDB();

        // Verify ownership
        const chat = await StudyChat.findOne({
            _id: chatId,
            userId: session.user.id,
        });

        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Delete all messages in the chat
        await StudyMessage.deleteMany({ chatId });

        // Delete the chat
        await StudyChat.deleteOne({ _id: chatId });

        return Response.json({ success: true });
    } catch (error) {
        console.error('[Study Chat] DELETE error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
