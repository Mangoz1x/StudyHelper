'use server';

import { auth } from '@/auth';
import { StudyChat, StudyMessage, StudyMemory } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * Get all study chats for a project
 *
 * @param {string} projectId - The project ID
 * @returns {Promise<{data?: Array, error?: string}>}
 */
export async function getStudyChats(projectId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId) {
            return { error: 'Project ID is required' };
        }

        await connectDB();

        const chats = await StudyChat.find({
            projectId,
            userId: session.user.id,
            status: 'active',
        })
            .sort({ lastActivityAt: -1 })
            .lean();

        return {
            data: chats.map((chat) => ({
                id: chat._id.toString(),
                title: chat.title,
                status: chat.status,
                messageCount: chat.messageCount,
                lastActivityAt: chat.lastActivityAt?.toISOString?.() || chat.lastActivityAt,
                createdAt: chat.createdAt?.toISOString?.() || chat.createdAt,
            })),
        };
    } catch (error) {
        console.error('getStudyChats error:', error);
        return { error: 'Failed to fetch study chats' };
    }
}

/**
 * Get a single study chat by ID
 *
 * @param {string} chatId - The chat ID
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function getStudyChat(chatId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!chatId) {
            return { error: 'Chat ID is required' };
        }

        await connectDB();

        const chat = await StudyChat.findOne({
            _id: chatId,
            userId: session.user.id,
        }).lean();

        if (!chat) {
            return { error: 'Chat not found' };
        }

        return {
            data: {
                id: chat._id.toString(),
                projectId: chat.projectId.toString(),
                title: chat.title,
                status: chat.status,
                messageCount: chat.messageCount,
                lastActivityAt: chat.lastActivityAt?.toISOString?.() || chat.lastActivityAt,
                createdAt: chat.createdAt?.toISOString?.() || chat.createdAt,
            },
        };
    } catch (error) {
        console.error('getStudyChat error:', error);
        return { error: 'Failed to fetch study chat' };
    }
}

/**
 * Get messages for a study chat
 *
 * @param {string} chatId - The chat ID
 * @param {Object} [options]
 * @param {number} [options.limit] - Number of messages to fetch
 * @param {string} [options.cursor] - Cursor for pagination
 * @returns {Promise<{data?: Array, error?: string}>}
 */
export async function getStudyMessages(chatId, { limit = 50, cursor } = {}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!chatId) {
            return { error: 'Chat ID is required' };
        }

        await connectDB();

        // Verify user owns this chat
        const chat = await StudyChat.findOne({
            _id: chatId,
            userId: session.user.id,
        }).lean();

        if (!chat) {
            return { error: 'Chat not found' };
        }

        const query = { chatId };
        if (cursor) {
            query._id = { $lt: cursor };
        }

        const messages = await StudyMessage.find(query)
            .sort({ createdAt: 1 })
            .limit(limit)
            .lean();

        return {
            data: messages.map((msg) => ({
                id: msg._id.toString(),
                role: msg.role,
                content: msg.content,
                inlineQuestion: msg.inlineQuestion
                    ? {
                          type: msg.inlineQuestion.type,
                          question: msg.inlineQuestion.question,
                          options: msg.inlineQuestion.options,
                          hint: msg.inlineQuestion.hint,
                          explanation: msg.inlineQuestion.explanation,
                          correctAnswer: msg.inlineQuestion.correctAnswer,
                          userAnswer: msg.inlineQuestion.userAnswer,
                          isCorrect: msg.inlineQuestion.isCorrect,
                      }
                    : null,
                toolCalls: msg.toolCalls?.map((tc) => ({
                    name: tc.name,
                    args: tc.args,
                    result: tc.result,
                })),
                createdAt: msg.createdAt?.toISOString?.() || msg.createdAt,
            })),
        };
    } catch (error) {
        console.error('getStudyMessages error:', error);
        return { error: 'Failed to fetch messages' };
    }
}

/**
 * Get all memories for a project
 *
 * @param {string} projectId - The project ID
 * @returns {Promise<{data?: Array, error?: string}>}
 */
export async function getStudyMemories(projectId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId) {
            return { error: 'Project ID is required' };
        }

        await connectDB();

        const memories = await StudyMemory.find({
            projectId,
            userId: session.user.id,
            status: 'active',
        })
            .sort({ createdAt: -1 })
            .lean();

        return {
            data: memories.map((memory) => ({
                id: memory._id.toString(),
                content: memory.content,
                category: memory.category,
                sourceMessageId: memory.sourceMessageId?.toString(),
                createdAt: memory.createdAt?.toISOString?.() || memory.createdAt,
            })),
        };
    } catch (error) {
        console.error('getStudyMemories error:', error);
        return { error: 'Failed to fetch memories' };
    }
}

/**
 * Delete a study chat and all its messages
 *
 * @param {string} chatId - The chat ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
export async function deleteStudyChat(chatId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!chatId) {
            return { error: 'Chat ID is required' };
        }

        await connectDB();

        // Verify user owns this chat
        const chat = await StudyChat.findOne({
            _id: chatId,
            userId: session.user.id,
        });

        if (!chat) {
            return { error: 'Chat not found' };
        }

        // Delete all messages
        await StudyMessage.deleteMany({ chatId });

        // Delete the chat
        await StudyChat.findByIdAndDelete(chatId);

        return { success: true };
    } catch (error) {
        console.error('deleteStudyChat error:', error);
        return { error: 'Failed to delete chat' };
    }
}
