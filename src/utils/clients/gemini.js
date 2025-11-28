import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// Re-export zod for use in other modules
export { z };

let instance = null;

/**
 * Gemini AI Client
 *
 * Lazy initialization pattern for the Google GenAI SDK.
 * Uses Gemini 3 Pro for complex reasoning and multimodal processing.
 *
 * @see https://ai.google.dev/gemini-api/docs/gemini-3
 * @see https://github.com/googleapis/js-genai
 */

/**
 * Available Gemini models
 */
export const GEMINI_MODELS = {
    // Gemini 3 - Latest and most intelligent
    PRO: 'gemini-3-pro-preview',           // Best for complex reasoning, 1M context
    PRO_IMAGE: 'gemini-3-pro-image-preview', // Image generation and editing

    // Gemini 2.5 - Previous generation (for fallback)
    FLASH_25: 'gemini-2.5-flash',          // Fast performance
    FLASH_LITE_25: 'gemini-2.5-flash-lite', // Cost-efficient
};

/**
 * Default model for the application
 */
export const DEFAULT_MODEL = GEMINI_MODELS.PRO;

/**
 * Thinking levels for Gemini 3 reasoning control
 * @see https://ai.google.dev/gemini-api/docs/thinking
 */
export const THINKING_LEVELS = {
    LOW: 'low',   // Minimizes latency/cost, best for simple tasks
    HIGH: 'high', // Maximizes reasoning depth (default)
};

/**
 * Media resolution options for multimodal content
 * Controls token usage per image/video frame
 */
export const MEDIA_RESOLUTION = {
    LOW: 'media_resolution_low',      // 280 tokens/image, 70 tokens/video frame
    MEDIUM: 'media_resolution_medium', // 560 tokens/image, 70 tokens/video frame
    HIGH: 'media_resolution_high',    // 1120 tokens/image, 280 tokens/video frame
};

/**
 * Get the GoogleGenAI client instance
 * Uses lazy initialization to prevent build-time errors
 *
 * @returns {GoogleGenAI} The GoogleGenAI client instance
 * @throws {Error} If GEMINI_API_KEY is not defined
 */
export const getGemini = () => {
    if (!instance) {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not defined');
        }

        instance = new GoogleGenAI({ apiKey });
    }

    return instance;
};

/**
 * Generate content using Gemini with optional streaming
 *
 * @param {Object} options
 * @param {string} options.prompt - The text prompt
 * @param {string} [options.model] - Model to use (defaults to PRO)
 * @param {Array} [options.files] - Array of file references from uploadFile
 * @param {'low'|'high'} [options.thinkingLevel] - Reasoning depth (Gemini 3 only)
 * @param {boolean} [options.includeThoughts] - Include thought summaries in streaming (requires stream: true)
 * @param {string} [options.mediaResolution] - Resolution for images/video
 * @param {Object} [options.responseSchema] - Zod schema for structured output
 * @param {Object} [options.config] - Additional generation config
 * @param {boolean} [options.stream] - Whether to stream the response (default: false)
 * @returns {Promise<Object|AsyncGenerator>} Response object or async generator if streaming
 *
 * @example
 * // Simple generation
 * const response = await generateContent({
 *     prompt: 'Summarize this document',
 *     files: [uploadedFile],
 * });
 *
 * // With streaming
 * const stream = await generateContent({
 *     prompt: 'Write a detailed analysis...',
 *     stream: true,
 * });
 * for await (const chunk of stream) {
 *     process.stdout.write(chunk.text);
 * }
 *
 * // With structured output using Zod schema
 * const schema = z.object({ title: z.string(), items: z.array(z.string()) });
 * const response = await generateContent({
 *     prompt: 'Extract data',
 *     responseSchema: schema,
 * });
 *
 * // With thinking level for complex reasoning
 * const response = await generateContent({
 *     prompt: 'Analyze this research paper and identify methodological issues',
 *     files: [pdfFile],
 *     thinkingLevel: 'high',
 * });
 */
export const generateContent = async ({
    prompt,
    model = DEFAULT_MODEL,
    files = [],
    thinkingLevel,
    includeThoughts = false,
    mediaResolution,
    responseSchema,
    config = {},
    stream = false,
}) => {
    const ai = getGemini();

    // Build contents array with files and prompt
    const contents = [];

    // Add file references first (better results when files come before text)
    for (const file of files) {
        if (file.type === 'youtube') {
            // YouTube videos - pass URL using fileData format
            contents.push({
                fileData: {
                    fileUri: file.url,
                },
            });
        } else if (file.type === 'file' || file.uri) {
            // Uploaded files via File API
            contents.push({
                fileData: {
                    fileUri: file.uri,
                    mimeType: file.mimeType,
                },
            });
        }
    }

    // Add text prompt
    contents.push({ text: prompt });

    // Build config with Gemini 3 options
    const generationConfig = { ...config };

    // Add thinking config
    if (thinkingLevel) {
        generationConfig.thinkingConfig = {
            thinkingLevel,
            includeThoughts,
        };
    }

    // Add media resolution if specified
    if (mediaResolution) {
        generationConfig.mediaResolution = mediaResolution;
    }

    // Add structured output schema if provided
    if (responseSchema) {
        generationConfig.responseMimeType = 'application/json';
        // Zod 4 has native JSON Schema support via z.toJSONSchema()
        generationConfig.responseSchema = z.toJSONSchema(responseSchema);
    }

    // Use streaming or non-streaming based on flag
    if (stream) {
        const response = await ai.models.generateContentStream({
            model,
            contents,
            config: generationConfig,
        });
        return response;
    } else {
        const response = await ai.models.generateContent({
            model,
            contents,
            config: generationConfig,
        });
        return response;
    }
};

/**
 * @deprecated Use generateContent with stream: true instead
 * Generate content with streaming (backwards compatibility wrapper)
 */
export const generateContentStream = (options) => {
    return generateContent({ ...options, stream: true });
};

/**
 * Upload a file to Gemini for use in prompts
 *
 * Files are stored for 48 hours and can be reused across multiple requests.
 * Use this for files larger than 20MB or when reusing files across prompts.
 *
 * @param {Object} options
 * @param {string|Buffer|Blob} options.file - File path, buffer, or Blob
 * @param {string} options.mimeType - MIME type of the file
 * @param {string} [options.displayName] - Display name for the file
 * @returns {Promise<Object>} File object with uri and mimeType
 *
 * @example
 * const file = await uploadFile({
 *     file: '/path/to/document.pdf',
 *     mimeType: 'application/pdf',
 *     displayName: 'My Document',
 * });
 */
export const uploadFile = async ({ file, mimeType, displayName }) => {
    const ai = getGemini();

    // Convert Buffer to Blob if necessary (SDK expects file path or Blob)
    let fileToUpload = file;
    if (Buffer.isBuffer(file)) {
        fileToUpload = new Blob([file], { type: mimeType });
    }

    const result = await ai.files.upload({
        file: fileToUpload,
        config: {
            mimeType,
            displayName,
        },
    });

    return result;
};

/**
 * Get file metadata
 *
 * @param {string} fileName - The file name (from upload result)
 * @returns {Promise<Object>} File metadata
 */
export const getFile = async (fileName) => {
    const ai = getGemini();
    return ai.files.get({ name: fileName });
};

/**
 * Delete an uploaded file
 *
 * @param {string} fileName - The file name to delete
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileName) => {
    const ai = getGemini();
    return ai.files.delete({ name: fileName });
};

/**
 * List all uploaded files
 *
 * @param {Object} [options]
 * @param {number} [options.pageSize=10] - Number of files per page
 * @returns {AsyncGenerator} Yields file objects
 */
export const listFiles = async ({ pageSize = 10 } = {}) => {
    const ai = getGemini();
    return ai.files.list({ config: { pageSize } });
};

/**
 * Wait for a file to finish processing
 *
 * Videos and large files require processing time before they can be used.
 *
 * @param {string} fileName - The file name to wait for
 * @param {number} [pollInterval=5000] - Polling interval in ms
 * @param {number} [maxAttempts=60] - Maximum polling attempts
 * @returns {Promise<Object>} The processed file
 * @throws {Error} If processing fails or times out
 */
export const waitForFileProcessing = async (
    fileName,
    pollInterval = 5000,
    maxAttempts = 60
) => {
    const ai = getGemini();
    let attempts = 0;

    while (attempts < maxAttempts) {
        const file = await ai.files.get({ name: fileName });

        if (file.state === 'ACTIVE') {
            return file;
        }

        if (file.state === 'FAILED') {
            throw new Error(`File processing failed: ${file.error?.message || 'Unknown error'}`);
        }

        // Still processing
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        attempts++;
    }

    throw new Error('File processing timed out');
};

/**
 * Supported MIME types for different content categories
 */
export const SUPPORTED_MIME_TYPES = {
    // Images
    images: [
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/heic',
        'image/heif',
    ],
    // Videos
    videos: [
        'video/mp4',
        'video/mpeg',
        'video/mov',
        'video/avi',
        'video/x-flv',
        'video/mpg',
        'video/webm',
        'video/wmv',
        'video/3gpp',
    ],
    // Audio
    audio: [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/aiff',
        'audio/aac',
        'audio/ogg',
        'audio/flac',
    ],
    // Documents
    documents: [
        'application/pdf',
        'text/plain',
        'text/html',
        'text/css',
        'text/javascript',
        'application/json',
        'text/markdown',
    ],
};

/**
 * Check if a MIME type is supported
 *
 * @param {string} mimeType - The MIME type to check
 * @returns {boolean} Whether the type is supported
 */
export const isSupportedMimeType = (mimeType) => {
    const allTypes = [
        ...SUPPORTED_MIME_TYPES.images,
        ...SUPPORTED_MIME_TYPES.videos,
        ...SUPPORTED_MIME_TYPES.audio,
        ...SUPPORTED_MIME_TYPES.documents,
    ];
    return allTypes.includes(mimeType);
};
