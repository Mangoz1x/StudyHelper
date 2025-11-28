import { generateContent, GEMINI_MODELS, THINKING_LEVELS } from '@/utils/clients';
import { ensureGeminiFilesForMaterials } from '@/utils/ensureGeminiFile';
import { buildStudySystemPrompt } from './studyModePrompt';
import { buildFunctionDeclarations } from './studyModeTools';

/**
 * Study Chat Response Generator
 *
 * Generates AI tutor responses with streaming support and tool calling
 * for memory management and question creation.
 */

/**
 * Prepare file attachments from materials for Gemini
 * @param {Array} materials - Materials with file references
 * @param {Array} chatFiles - Chat-specific files [{geminiUri, mimeType, name}]
 * @returns {Array} File attachments in Gemini format
 */
function prepareFileAttachments(materials, chatFiles = []) {
    const files = [];

    for (const material of materials) {
        // YouTube videos - pass URL directly
        if (material.type === 'youtube' && material.youtube?.url) {
            files.push({
                type: 'youtube',
                url: material.youtube.url,
            });
        }
        // Uploaded files with Gemini URI
        else if (material.file?.geminiUri && material.file?.mimeType) {
            files.push({
                type: 'file',
                uri: material.file.geminiUri,
                mimeType: material.file.mimeType,
            });
        }
    }

    // Add chat-specific files (uploaded with the current message)
    for (const chatFile of chatFiles) {
        if (chatFile.geminiUri && chatFile.mimeType) {
            files.push({
                type: 'file',
                uri: chatFile.geminiUri,
                mimeType: chatFile.mimeType,
            });
        }
    }

    return files;
}

/**
 * Format chat messages for Gemini, including inline question responses and attachments
 * @param {Array} messages - Chat history
 * @returns {string} Formatted conversation
 */
function formatMessagesForGemini(messages) {
    return messages
        .map((m) => {
            let text = `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`;

            // Include attachment info if present
            if (m.attachments && m.attachments.length > 0) {
                const attachmentNames = m.attachments.map(a => a.name).join(', ');
                text += `\n[Attached files: ${attachmentNames}]`;
            }

            // Include inline question + response if present and answered
            if (m.inlineQuestion && m.inlineQuestion.userAnswer !== undefined) {
                text += `\n\n[Quiz Question Asked: "${m.inlineQuestion.question}"]`;
                text += `\n[Student's Answer: ${JSON.stringify(m.inlineQuestion.userAnswer)}]`;
                text += `\n[Result: ${m.inlineQuestion.isCorrect ? 'Correct' : 'Incorrect'}]`;
            }

            return text;
        })
        .join('\n\n');
}

/**
 * Update materials with fresh Gemini file URIs
 * @param {Array} materials - Original materials
 * @param {Map} geminiFileMap - Map of material ID to fresh file info
 * @returns {Array} Materials with updated URIs
 */
function updateMaterialsWithFreshUris(materials, geminiFileMap) {
    return materials.map((m) => {
        const freshFile = geminiFileMap.get(m._id?.toString());
        if (freshFile && m.file) {
            return {
                ...m,
                file: {
                    ...m.file,
                    geminiUri: freshFile.uri,
                    mimeType: freshFile.mimeType,
                },
            };
        }
        return m;
    });
}

/**
 * Generate a study mode chat response with streaming
 *
 * @param {Object} options
 * @param {Array} options.messages - Chat history [{role, content, inlineQuestion?, attachments?}]
 * @param {Array} options.materials - Project materials with file references
 * @param {Array} options.memories - Project memories [{id, content, category}]
 * @param {Array} options.artifacts - Project artifacts [{id, type, title, description, content}]
 * @param {string} options.projectName - Project name for context
 * @param {Array} options.chatFiles - Files uploaded with current message [{geminiUri, mimeType, name}]
 * @param {Function} options.onProgress - Streaming callback
 * @returns {Promise<Object>} Generated response with content and tool calls
 */
export async function generateStudyChatResponse({
    messages,
    materials,
    memories,
    artifacts = [],
    projectName,
    chatFiles = [],
    onProgress,
}) {
    console.log('[StudyChatGenerate] Starting generation with:', {
        messageCount: messages.length,
        materialCount: materials.length,
        memoryCount: memories.length,
        artifactCount: artifacts.length,
        chatFilesCount: chatFiles.length,
    });

    // 1. Ensure all file-based materials have valid (non-expired) Gemini files
    const geminiFileMap = await ensureGeminiFilesForMaterials(materials);

    // 2. Update materials with fresh URIs where needed
    const materialsWithFiles = updateMaterialsWithFreshUris(materials, geminiFileMap);

    // 3. Prepare file attachments for Gemini
    const files = prepareFileAttachments(materialsWithFiles, chatFiles);

    console.log('[StudyChatGenerate] Prepared files for Gemini:', files.length, 'files');

    // 4. Build system prompt
    const systemPrompt = buildStudySystemPrompt({
        projectName,
        memories,
        materialNames: materials.map((m) => m.name),
        artifacts,
    });

    // 5. Format conversation history
    const formattedHistory = formatMessagesForGemini(messages);

    // 6. Build the full prompt
    const fullPrompt = `${systemPrompt}\n\n---\n\nConversation:\n${formattedHistory}\n\nTutor:`;

    // 7. Generate with streaming and tools
    try {
        const stream = await generateContent({
            prompt: fullPrompt,
            files,
            model: GEMINI_MODELS.PRO,
            thinkingLevel: THINKING_LEVELS.LOW,
            stream: true,
            config: {
                tools: [
                    {
                        functionDeclarations: buildFunctionDeclarations(),
                    },
                ],
            },
        });

        // 8. Process stream
        let textBuffer = '';
        const toolCalls = [];

        for await (const chunk of stream) {
            const parts = chunk.candidates?.[0]?.content?.parts || [];

            for (const part of parts) {
                // Handle text content
                if (part.text) {
                    textBuffer += part.text;
                    onProgress?.({ type: 'content', content: part.text });
                }

                // Handle function calls
                if (part.functionCall) {
                    toolCalls.push({
                        type: part.functionCall.name,
                        data: part.functionCall.args,
                    });
                }
            }

            // Also check for text directly on chunk (fallback)
            if (chunk.text && !parts.length) {
                textBuffer += chunk.text;
                onProgress?.({ type: 'content', content: chunk.text });
            }
        }

        return {
            content: textBuffer,
            toolCalls,
        };
    } catch (error) {
        console.error('[StudyChatGenerate] Error:', error);
        throw error;
    }
}
