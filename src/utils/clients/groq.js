/**
 * GROQ Client for Whisper Transcription
 *
 * Uses GROQ's Whisper API for fast audio/video transcription.
 * @see https://console.groq.com/docs/speech-to-text
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';

/**
 * Transcribe audio/video file using GROQ Whisper
 *
 * @param {Object} options
 * @param {File|Blob|Buffer} options.file - Audio/video file to transcribe
 * @param {string} options.filename - Original filename
 * @param {string} [options.language] - Language code (e.g., 'en', 'es')
 * @param {string} [options.prompt] - Optional prompt to guide transcription
 * @returns {Promise<{text: string, duration?: number}>}
 */
export async function transcribeWithWhisper({ file, filename, language, prompt }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable is not set');
    }

    const formData = new FormData();

    // Handle different file types
    if (Buffer.isBuffer(file)) {
        formData.append('file', new Blob([file]), filename);
    } else {
        formData.append('file', file, filename);
    }

    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');

    if (language) {
        formData.append('language', language);
    }

    if (prompt) {
        formData.append('prompt', prompt);
    }

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GROQ transcription failed: ${error}`);
    }

    const result = await response.json();

    return {
        text: result.text,
        duration: result.duration,
        language: result.language,
    };
}

/**
 * Check if GROQ API key is configured
 */
export function isGroqConfigured() {
    return !!process.env.GROQ_API_KEY;
}
