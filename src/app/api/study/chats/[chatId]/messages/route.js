export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { StudyChat, StudyMessage, StudyMemory, Material, Project, Artifact } from '@/models';
import { connectDB, uploadFile, waitForFileProcessing } from '@/utils/clients';
import { generateStudyChatResponse } from '@/utils/ai/studyChatGenerate';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

/**
 * Check if a string is a valid MongoDB ObjectId
 */
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

/**
 * Normalize artifact content to fix common LLM schema mistakes
 * For lessons, the LLM sometimes puts question type at section level instead of nesting
 */
function normalizeArtifactContent(type, content) {
    if (!content) {
        return {};
    }

    if (type === 'lesson' && content.sections) {
        const normalizedSections = content.sections.map((section, idx) => {
            // Ensure section has an ID
            const sectionId = section.id || `section-${idx}-${uuidv4().slice(0, 8)}`;

            // Check if section type is a question type (LLM mistake)
            const questionTypes = ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'long_answer', 'fill_blank'];
            if (questionTypes.includes(section.type)) {
                // LLM put question type at section level - fix it
                return {
                    id: sectionId,
                    type: 'question',
                    question: {
                        id: `q-${sectionId}`,
                        type: section.type,
                        question: section.question || section.content || '',
                        options: section.options || [],
                        correctAnswer: section.correctAnswer,
                        explanation: section.explanation || '',
                        hint: section.hint,
                    },
                };
            }

            // Normal case - section type is 'content' or 'question'
            if (section.type === 'question') {
                // Ensure question object exists and has an ID
                const question = section.question || {};
                return {
                    id: sectionId,
                    type: 'question',
                    question: {
                        id: question.id || `q-${sectionId}`,
                        type: question.type || 'short_answer',
                        question: question.question || '',
                        options: question.options || [],
                        correctAnswer: question.correctAnswer,
                        explanation: question.explanation || '',
                        hint: question.hint,
                    },
                };
            }

            // Content section
            return {
                id: sectionId,
                type: 'content',
                content: section.content || '',
            };
        });

        return {
            ...content,
            sections: normalizedSections,
        };
    }

    // For study_plan, ensure items have IDs
    if (type === 'study_plan' && content.items) {
        const normalizedItems = content.items.map((item, idx) => ({
            ...item,
            id: item.id || `item-${idx}-${uuidv4().slice(0, 8)}`,
            children: (item.children || []).map((child, cidx) => ({
                ...child,
                id: child.id || `child-${idx}-${cidx}-${uuidv4().slice(0, 8)}`,
            })),
        }));
        return { ...content, items: normalizedItems };
    }

    // For flashcards, ensure cards have IDs
    if (type === 'flashcards' && content.cards) {
        const normalizedCards = content.cards.map((card, idx) => ({
            ...card,
            id: card.id || `card-${idx}-${uuidv4().slice(0, 8)}`,
        }));
        return { ...content, cards: normalizedCards };
    }

    return content;
}

/**
 * GET /api/study/chats/[chatId]/messages
 * Get paginated messages for a chat
 */
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const before = searchParams.get('before'); // cursor for pagination

        await connectDB();

        // Verify ownership
        const chat = await StudyChat.findOne({
            _id: chatId,
            userId: session.user.id,
        });

        if (!chat) {
            return Response.json({ error: 'Chat not found' }, { status: 404 });
        }

        // Build query
        const query = { chatId };
        if (before) {
            query._id = { $lt: before };
        }

        // Fetch messages
        const messages = await StudyMessage.find(query)
            .sort({ createdAt: -1 }) // Newest first for pagination
            .limit(limit + 1) // Fetch one extra to check if there are more
            .lean();

        // Check if there are more messages
        const hasMore = messages.length > limit;
        if (hasMore) {
            messages.pop(); // Remove the extra message
        }

        // Reverse to get chronological order
        messages.reverse();

        // Transform for response
        const data = messages.map((msg) => ({
            id: msg._id.toString(),
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments || [],
            toolCalls: msg.toolCalls || [],
            artifactActions: msg.artifactActions || [],
            inlineQuestion: msg.inlineQuestion || null,
            metadata: msg.metadata || {},
            createdAt: msg.createdAt,
        }));

        return Response.json({
            data: {
                messages: data,
                hasMore,
                nextCursor: hasMore ? messages[0]._id.toString() : null,
            },
        });
    } catch (error) {
        console.error('[Study Messages] GET error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Helper to send SSE message
 */
function sendSSE(controller, encoder, type, data) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
}

/**
 * Parse request body - handles both JSON and FormData
 */
async function parseRequestBody(request) {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const content = formData.get('content') || '';

        // Extract files
        const files = [];
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('file_') && value instanceof File) {
                files.push(value);
            }
        }

        return { content, files };
    } else {
        const json = await request.json();
        return { content: json.content || '', files: [] };
    }
}

/**
 * Upload files to Gemini for the chat message
 */
async function uploadChatFiles(files) {
    const uploadedFiles = [];

    for (const file of files) {
        const mimeType = file.type;
        const isVideo = mimeType.startsWith('video/');
        const isAudio = mimeType.startsWith('audio/');

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('[Chat Files] Uploading file:', file.name, 'mimeType:', mimeType);

        // Upload to Gemini
        const uploadedFile = await uploadFile({
            file: buffer,
            mimeType,
            displayName: file.name,
        });

        console.log('[Chat Files] Upload response:', JSON.stringify(uploadedFile, null, 2));

        // Wait for processing for videos and audio (they require additional processing time)
        let processedFile = uploadedFile;
        if (isVideo || isAudio) {
            console.log('[Chat Files] Waiting for processing...');
            processedFile = await waitForFileProcessing(uploadedFile.name);
            console.log('[Chat Files] Processing complete:', processedFile.uri);
        }

        uploadedFiles.push({
            name: file.name,
            mimeType,
            size: file.size,
            geminiUri: processedFile.uri,
            geminiFileName: processedFile.name,
        });

        console.log('[Chat Files] File ready:', {
            name: file.name,
            geminiUri: processedFile.uri,
        });
    }

    return uploadedFiles;
}

/**
 * POST /api/study/chats/[chatId]/messages
 * Send a message and receive streamed AI response
 *
 * If chatId is "new", creates a new chat first (requires projectId query param)
 * Accepts both JSON and FormData (for file uploads)
 */
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chatId } = await params;
        const { searchParams } = new URL(request.url);
        const { content, files } = await parseRequestBody(request);

        if (!content?.trim() && files.length === 0) {
            return Response.json({ error: 'Message content or files required' }, { status: 400 });
        }

        await connectDB();

        let chat;
        let isNewChat = false;

        if (chatId === 'new') {
            // Create a new chat
            const projectId = searchParams.get('projectId');
            if (!projectId) {
                return Response.json({ error: 'projectId is required for new chats' }, { status: 400 });
            }

            // Verify user owns the project
            const project = await Project.findOne({
                _id: projectId,
                userId: session.user.id,
            });

            if (!project) {
                return Response.json({ error: 'Project not found' }, { status: 404 });
            }

            chat = await StudyChat.create({
                projectId,
                userId: session.user.id,
                title: 'New Chat',
                status: 'active',
            });
            isNewChat = true;
        } else {
            // Verify ownership and get existing chat
            chat = await StudyChat.findOne({
                _id: chatId,
                userId: session.user.id,
            });

            if (!chat) {
                return Response.json({ error: 'Chat not found' }, { status: 404 });
            }
        }

        // Get project for context
        const project = await Project.findById(chat.projectId);
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        const actualChatId = chat._id.toString();

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // 0. If new chat, send the chat_created event
                    if (isNewChat) {
                        sendSSE(controller, encoder, 'chat_created', {
                            chatId: actualChatId,
                        });
                    }

                    // 1. Upload any attached files to Gemini
                    let uploadedFiles = [];
                    if (files.length > 0) {
                        sendSSE(controller, encoder, 'uploading_files', {
                            count: files.length,
                        });
                        uploadedFiles = await uploadChatFiles(files);
                        sendSSE(controller, encoder, 'files_uploaded', {
                            files: uploadedFiles.map(f => ({ name: f.name, mimeType: f.mimeType })),
                        });
                    }

                    // 2. Save user message
                    const userMessage = await StudyMessage.create({
                        chatId: actualChatId,
                        userId: session.user.id,
                        role: 'user',
                        content: content.trim() || (files.length > 0 ? `[Attached ${files.length} file(s)]` : ''),
                        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
                    });
                    sendSSE(controller, encoder, 'message_saved', {
                        messageId: userMessage._id.toString(),
                        attachments: uploadedFiles,
                    });

                    // 3. Load context
                    const [chatHistory, materials, memories, artifacts] = await Promise.all([
                        // Get recent messages for context (last 50)
                        StudyMessage.find({ chatId: actualChatId })
                            .sort({ createdAt: -1 })
                            .limit(50)
                            .lean()
                            .then((msgs) => msgs.reverse()),
                        // Get ready materials (both project and study_mode scoped)
                        Material.find({
                            projectId: chat.projectId,
                            status: 'ready',
                        }).lean(),
                        // Get active memories for this project
                        StudyMemory.find({
                            projectId: chat.projectId,
                            userId: session.user.id,
                            isActive: true,
                        }).lean(),
                        // Get active artifacts for this project
                        Artifact.find({
                            projectId: chat.projectId,
                            userId: session.user.id,
                            status: 'active',
                        }).lean(),
                    ]);

                    // 3. Create placeholder assistant message
                    const assistantMessage = await StudyMessage.create({
                        chatId: actualChatId,
                        userId: session.user.id,
                        role: 'assistant',
                        content: '', // Will be updated after streaming
                    });
                    sendSSE(controller, encoder, 'start', {
                        messageId: assistantMessage._id.toString(),
                    });

                    // 4. Generate response with streaming
                    const startTime = Date.now();
                    const result = await generateStudyChatResponse({
                        messages: chatHistory.map((m) => ({
                            role: m.role,
                            content: m.content,
                            inlineQuestion: m.inlineQuestion,
                            attachments: m.attachments,
                        })),
                        materials,
                        memories: memories.map((m) => ({
                            id: m._id.toString(),
                            content: m.content,
                            category: m.category,
                        })),
                        artifacts: artifacts.map((a) => ({
                            id: a._id.toString(),
                            type: a.type,
                            title: a.title,
                            description: a.description,
                            content: a.content,
                        })),
                        projectName: project.name,
                        chatFiles: uploadedFiles, // Include files uploaded with this message
                        onProgress: (progress) => {
                            if (progress.type === 'content') {
                                sendSSE(controller, encoder, 'content', { content: progress.content });
                            } else if (progress.type === 'thinking') {
                                sendSSE(controller, encoder, 'thinking', { content: progress.content });
                            }
                        },
                    });
                    const generationTimeMs = Date.now() - startTime;

                    // 5. Process tool calls
                    const processedToolCalls = [];
                    const artifactActions = [];
                    let inlineQuestion = null;

                    // Count artifact creations for progress (check both old and new tool names)
                    const artifactCreations = (result.toolCalls || []).filter(tc =>
                        tc.type === 'artifact_create' ||
                        tc.type === 'artifact_create_study_plan' ||
                        tc.type === 'artifact_create_lesson' ||
                        tc.type === 'artifact_create_flashcards'
                    );
                    if (artifactCreations.length > 0) {
                        sendSSE(controller, encoder, 'artifacts_creating', {
                            count: artifactCreations.length,
                        });
                    }

                    for (const tc of result.toolCalls || []) {
                        // Debug log to see tool call structure
                        console.log('[Tool Call]', tc.type, JSON.stringify(tc.data, null, 2));

                        // Handle new separated artifact tools
                        if (tc.type === 'artifact_create_study_plan' ||
                            tc.type === 'artifact_create_lesson' ||
                            tc.type === 'artifact_create_flashcards') {
                            // Extract type from tool name
                            const artifactType = tc.type.replace('artifact_create_', '');
                            const artifactTitle = tc.data?.title;
                            const artifactDescription = tc.data?.description;

                            // Content is now at top level based on type
                            let artifactContent = {};
                            if (artifactType === 'study_plan') {
                                artifactContent = { items: tc.data?.items || [] };
                            } else if (artifactType === 'lesson') {
                                artifactContent = { sections: tc.data?.sections || [] };
                            } else if (artifactType === 'flashcards') {
                                artifactContent = { cards: tc.data?.cards || [] };
                            }

                            if (!artifactTitle || typeof artifactTitle !== 'string') {
                                console.error('Missing artifact title, Full data:', JSON.stringify(tc.data));
                                continue;
                            }

                            // Normalize artifact content to fix any remaining issues
                            const normalizedContent = normalizeArtifactContent(artifactType, artifactContent);

                            // Create the artifact
                            const artifact = await Artifact.create({
                                projectId: chat.projectId,
                                chatId: actualChatId,
                                userId: session.user.id,
                                type: artifactType,
                                title: artifactTitle,
                                description: artifactDescription || '',
                                content: normalizedContent,
                                status: 'active',
                                sourceMessageId: assistantMessage._id,
                            });

                            const artifactData = {
                                id: artifact._id.toString(),
                                type: artifact.type,
                                title: artifact.title,
                                description: artifact.description,
                                content: artifact.content,
                                status: artifact.status,
                            };

                            const toolResult = { artifactId: artifact._id.toString() };
                            processedToolCalls.push({ ...tc, result: toolResult });

                            artifactActions.push({
                                artifactId: artifact._id,
                                actionType: 'created',
                                artifact: {
                                    type: artifact.type,
                                    title: artifact.title,
                                    description: artifact.description,
                                },
                            });

                            sendSSE(controller, encoder, 'artifact_created', {
                                artifactId: artifact._id.toString(),
                                artifact: artifactData,
                            });
                        } else if (tc.type === 'artifact_create') {
                            // Handle old unified artifact_create tool (backwards compatibility)
                            let artifactType = tc.data?.type;
                            let artifactTitle = tc.data?.title;
                            let artifactDescription = tc.data?.description;
                            let artifactContent = tc.data?.content || {};

                            // Check if type/title are nested inside content (common LLM mistake)
                            if (!artifactType && artifactContent?.type) {
                                console.log('[Artifact] Fixing nested structure - type/title inside content');
                                artifactType = artifactContent.type;
                                artifactTitle = artifactContent.title || artifactTitle;
                                artifactDescription = artifactContent.description || artifactDescription;
                                artifactContent = {
                                    sections: artifactContent.sections,
                                    items: artifactContent.items,
                                    cards: artifactContent.cards,
                                };
                            }

                            if (!artifactType || !['study_plan', 'lesson', 'flashcards'].includes(artifactType)) {
                                console.error('Invalid artifact type:', artifactType, 'Full data:', JSON.stringify(tc.data));
                                continue;
                            }

                            if (!artifactTitle || typeof artifactTitle !== 'string') {
                                console.error('Missing artifact title, Full data:', JSON.stringify(tc.data));
                                continue;
                            }

                            // Normalize artifact content to fix common LLM mistakes
                            const normalizedContent = normalizeArtifactContent(artifactType, artifactContent);

                            // Create a new artifact
                            const artifact = await Artifact.create({
                                projectId: chat.projectId,
                                chatId: actualChatId,
                                userId: session.user.id,
                                type: artifactType,
                                title: artifactTitle,
                                description: artifactDescription || '',
                                content: normalizedContent,
                                status: 'active',
                                sourceMessageId: assistantMessage._id,
                            });

                            const artifactData = {
                                id: artifact._id.toString(),
                                type: artifact.type,
                                title: artifact.title,
                                description: artifact.description,
                                content: artifact.content,
                                status: artifact.status,
                            };

                            const toolResult = { artifactId: artifact._id.toString() };
                            processedToolCalls.push({ ...tc, result: toolResult });

                            // Track artifact action for display in chat
                            artifactActions.push({
                                artifactId: artifact._id,
                                actionType: 'created',
                                artifact: {
                                    type: artifact.type,
                                    title: artifact.title,
                                    description: artifact.description,
                                },
                            });

                            sendSSE(controller, encoder, 'artifact_created', {
                                artifactId: artifact._id.toString(),
                                artifact: artifactData,
                            });
                        } else if (tc.type === 'artifact_update') {
                            // Validate artifactId is a valid ObjectId
                            if (!isValidObjectId(tc.data.artifactId)) {
                                console.warn('[Artifact Update] Invalid ObjectId:', tc.data.artifactId);
                                continue;
                            }
                            // Update existing artifact
                            const artifact = await Artifact.findOne({
                                _id: tc.data.artifactId,
                                userId: session.user.id,
                            });

                            if (artifact) {
                                const updateObj = {
                                    $set: {
                                        version: artifact.version + 1,
                                        lastEditedBy: 'assistant',
                                    },
                                };

                                // Apply updates based on artifact type
                                const { updates } = tc.data;
                                if (updates.title) updateObj.$set.title = updates.title;
                                if (updates.description !== undefined)
                                    updateObj.$set.description = updates.description;

                                // Lesson section operations
                                if (updates.addSections && artifact.type === 'lesson') {
                                    updateObj.$push = { 'content.sections': { $each: updates.addSections } };
                                }
                                if (updates.removeSection && artifact.type === 'lesson') {
                                    updateObj.$pull = { 'content.sections': { id: updates.removeSection } };
                                }

                                // Study plan item operations
                                if (updates.addItems && artifact.type === 'study_plan') {
                                    updateObj.$push = { 'content.items': { $each: updates.addItems } };
                                }
                                if (updates.removeItem && artifact.type === 'study_plan') {
                                    updateObj.$pull = { 'content.items': { id: updates.removeItem } };
                                }

                                // Flashcard operations
                                if (updates.addCards && artifact.type === 'flashcards') {
                                    updateObj.$push = { 'content.cards': { $each: updates.addCards } };
                                }
                                if (updates.removeCard && artifact.type === 'flashcards') {
                                    updateObj.$pull = { 'content.cards': { id: updates.removeCard } };
                                }

                                const updatedArtifact = await Artifact.findByIdAndUpdate(
                                    tc.data.artifactId,
                                    updateObj,
                                    { new: true }
                                ).lean();

                                const toolResult = { success: true };
                                processedToolCalls.push({ ...tc, result: toolResult });

                                // Track artifact action for display in chat
                                artifactActions.push({
                                    artifactId: artifact._id,
                                    actionType: 'updated',
                                    artifact: {
                                        type: updatedArtifact.type,
                                        title: updatedArtifact.title,
                                        description: updatedArtifact.description,
                                    },
                                });

                                sendSSE(controller, encoder, 'artifact_updated', {
                                    artifactId: tc.data.artifactId,
                                    artifact: {
                                        id: updatedArtifact._id.toString(),
                                        type: updatedArtifact.type,
                                        title: updatedArtifact.title,
                                        description: updatedArtifact.description,
                                        content: updatedArtifact.content,
                                        status: updatedArtifact.status,
                                    },
                                });
                            }
                        } else if (tc.type === 'artifact_delete') {
                            // Validate artifactId is a valid ObjectId
                            if (!isValidObjectId(tc.data.artifactId)) {
                                console.warn('[Artifact Delete] Invalid ObjectId:', tc.data.artifactId);
                                continue;
                            }
                            // Archive artifact
                            const artifact = await Artifact.findOneAndUpdate(
                                { _id: tc.data.artifactId, userId: session.user.id },
                                { $set: { status: 'archived' } },
                                { new: false } // Get old document for title
                            );

                            if (artifact) {
                                const toolResult = { success: true };
                                processedToolCalls.push({ ...tc, result: toolResult });

                                // Track artifact action for display in chat
                                artifactActions.push({
                                    artifactId: artifact._id,
                                    actionType: 'deleted',
                                    artifact: {
                                        type: artifact.type,
                                        title: artifact.title,
                                        description: artifact.description,
                                    },
                                });

                                sendSSE(controller, encoder, 'artifact_deleted', {
                                    artifactId: tc.data.artifactId,
                                });
                            }
                        } else if (tc.type === 'memory_create') {
                            const memory = await StudyMemory.create({
                                projectId: chat.projectId,
                                userId: session.user.id,
                                content: tc.data.content,
                                category: tc.data.category || 'other',
                                importance: tc.data.importance || 3,
                                sourceChatId: actualChatId,
                            });
                            const toolResult = { memoryId: memory._id.toString() };
                            processedToolCalls.push({ ...tc, result: toolResult });
                            sendSSE(controller, encoder, 'tool_call', {
                                tool: tc.type,
                                data: tc.data,
                                result: toolResult,
                            });
                        } else if (tc.type === 'memory_update') {
                            // Validate memoryId is a valid ObjectId
                            if (!isValidObjectId(tc.data.memoryId)) {
                                console.warn('[Memory Update] Invalid ObjectId:', tc.data.memoryId);
                                continue;
                            }
                            await StudyMemory.updateOne(
                                { _id: tc.data.memoryId, userId: session.user.id },
                                { content: tc.data.content }
                            );
                            processedToolCalls.push({ ...tc, result: { success: true } });
                            sendSSE(controller, encoder, 'tool_call', {
                                tool: tc.type,
                                data: tc.data,
                            });
                        } else if (tc.type === 'memory_delete') {
                            // Validate memoryId is a valid ObjectId
                            if (!isValidObjectId(tc.data.memoryId)) {
                                console.warn('[Memory Delete] Invalid ObjectId:', tc.data.memoryId);
                                continue;
                            }
                            await StudyMemory.updateOne(
                                { _id: tc.data.memoryId, userId: session.user.id },
                                { isActive: false }
                            );
                            processedToolCalls.push({ ...tc, result: { success: true } });
                            sendSSE(controller, encoder, 'tool_call', {
                                tool: tc.type,
                                data: tc.data,
                            });
                        } else if (tc.type === 'question_create') {
                            inlineQuestion = {
                                id: crypto.randomUUID(),
                                type: tc.data.type,
                                question: tc.data.question,
                                options: tc.data.options || [],
                                correctAnswer: tc.data.correctAnswer,
                                explanation: tc.data.explanation || '',
                                hint: tc.data.hint || '',
                            };
                            processedToolCalls.push({ ...tc, result: { questionId: inlineQuestion.id } });
                            sendSSE(controller, encoder, 'question', { data: inlineQuestion });
                        }
                    }

                    // 6. Update assistant message with full content
                    await StudyMessage.updateOne(
                        { _id: assistantMessage._id },
                        {
                            content: result.content || '',
                            toolCalls: processedToolCalls,
                            artifactActions: artifactActions.length > 0 ? artifactActions : undefined,
                            inlineQuestion,
                            metadata: {
                                generationTimeMs,
                            },
                        }
                    );

                    // 7. Update chat metadata
                    await StudyChat.updateOne(
                        { _id: actualChatId },
                        {
                            $inc: { messageCount: 2 },
                            $set: { lastActivityAt: new Date() },
                        }
                    );

                    // 8. Auto-generate title from first user message if it's "New Chat"
                    if (chat.title === 'New Chat' && (chat.messageCount === 0 || isNewChat)) {
                        // Simple title: first 50 chars of first message
                        const newTitle = content.trim().slice(0, 50) + (content.length > 50 ? '...' : '');
                        await StudyChat.updateOne({ _id: actualChatId }, { title: newTitle });
                        sendSSE(controller, encoder, 'chat_title_updated', {
                            chatId: actualChatId,
                            title: newTitle,
                        });
                    }

                    sendSSE(controller, encoder, 'message_complete', {
                        messageId: assistantMessage._id.toString(),
                    });

                    sendSSE(controller, encoder, 'complete', {
                        metadata: { generationTimeMs },
                    });
                } catch (error) {
                    console.error('[Study Messages] Streaming error:', error);
                    sendSSE(controller, encoder, 'error', { message: error.message || 'Unknown error' });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    } catch (error) {
        console.error('[Study Messages] POST error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
