/**
 * Centralized Service Clients
 *
 * All external service clients are exported from here using lazy initialization.
 * This prevents build-time errors and ensures consistent client management.
 *
 * Usage:
 * import { connectDB, getMongoose } from '@/utils/clients';
 * import { getGemini, generateContent, uploadFile } from '@/utils/clients';
 */

// MongoDB
export { connectDB, getMongoose, isDBConnected } from './mongodb';

// Gemini AI (Gemini 3 Pro)
export {
    getGemini,
    generateContent,
    generateContentStream, // @deprecated - use generateContent with stream: true
    uploadFile,
    getFile,
    deleteFile,
    listFiles,
    waitForFileProcessing,
    GEMINI_MODELS,
    DEFAULT_MODEL,
    THINKING_LEVELS,
    MEDIA_RESOLUTION,
    SUPPORTED_MIME_TYPES,
    isSupportedMimeType,
    z,
} from './gemini';

// GROQ (Whisper transcription)
export {
    transcribeWithWhisper,
    isGroqConfigured,
} from './groq';
