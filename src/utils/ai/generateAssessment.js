import { generateContent, GEMINI_MODELS, THINKING_LEVELS, z } from '@/utils/clients';
import { ensureGeminiFilesForMaterials } from '@/utils/ensureGeminiFile';

/**
 * Zod schema for assessment structured output
 * @see https://ai.google.dev/gemini-api/docs/structured-output
 */
const AssessmentSchema = z.object({
    title: z.string().describe('Title of the assessment'),
    description: z.string().describe('Brief description of what this assessment covers'),
    questions: z.array(z.object({
        type: z.enum(['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'long_answer', 'fill_blank'])
            .describe('Type of question: multiple_choice (single answer with 4 options), multiple_select (multiple answers from options), true_false (2 options: true/false), short_answer (text input), long_answer (text area), fill_blank (fill in the blanks)'),
        question: z.string().describe('The question text'),
        options: z.array(z.object({
            id: z.string().describe('Unique identifier for this option (e.g., "a", "b", "c", "d" for multiple choice, "true"/"false" for true/false)'),
            text: z.string().describe('The text content of this option'),
            isCorrect: z.boolean().describe('Whether this option is correct'),
        })).optional().describe('Array of answer options. REQUIRED for multiple_choice (4 options), multiple_select (2-6 options), and true_false (exactly 2 options with ids "true" and "false"). NOT used for short_answer, long_answer, or fill_blank.'),
        correctAnswer: z.union([z.string(), z.array(z.string()), z.boolean()])
            .describe('The correct answer: string (option id for multiple_choice/true_false, or expected text for short_answer/long_answer), array of strings (option ids for multiple_select, or expected texts for fill_blank)'),
        explanation: z.string().describe('Explanation of why this is the correct answer'),
        points: z.number().default(1).describe('Points awarded for correct answer'),
        difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty level of this question'),
        topic: z.string().optional().describe('Topic or subject area this question covers'),
        hint: z.string().optional().describe('Optional hint to help answer the question'),
    })).describe('Array of assessment questions'),
});

/** Grading schema for AI-graded answers */
const GradingSchema = z.object({
    pointsEarned: z.number(),
    isCorrect: z.boolean(),
    feedback: z.string(),
    confidence: z.number(),
});

export { AssessmentSchema };

/** Question type descriptions */
const TYPE_DESC = {
    multiple_choice: 'single correct answer from 4 options (a,b,c,d)',
    multiple_select: 'multiple correct answers from options',
    true_false: 'true or false statement',
    short_answer: 'brief 1-3 sentence response',
    long_answer: 'detailed paragraph response',
    fill_blank: 'sentence with ___ for blanks',
};

/**
 * Build prompt from materials and settings
 * Separates text content from video/file references
 */
function buildPrompt(materials, settings) {
    const { questionCount = 10, questionTypes = ['multiple_choice'], difficulty = 'medium', focusTopics = [], customInstructions = '' } = settings;

    const types = questionTypes.map(t => `${t} (${TYPE_DESC[t]})`).join(', ');

    // Separate text materials from video/file materials
    const textMaterials = [];
    const videoMaterials = [];

    for (const m of materials) {
        // Text content - include in prompt
        if (m.content?.text) {
            textMaterials.push(`--- ${m.name} ---\n${m.content.text}`);
        } else if (m.summary) {
            textMaterials.push(`--- ${m.name} ---\n${m.summary}`);
        }

        // Videos and files - just note their presence (they'll be attached separately)
        if (m.type === 'youtube' && m.youtube?.url) {
            videoMaterials.push(`- YouTube video: ${m.name}`);
        } else if (m.type === 'video' && m.file?.geminiUri) {
            videoMaterials.push(`- Video file: ${m.name}`);
        }
    }

    const content = textMaterials.filter(Boolean).join('\n\n');
    const videoList = videoMaterials.length > 0 ? `\n\nVideo materials attached:\n${videoMaterials.join('\n')}` : '';

    // Build the prompt with or without text materials section
    let prompt = `Create ${questionCount} assessment questions based on the provided materials.
Types: ${types}
Difficulty: ${difficulty}${focusTopics.length ? `\nTopics: ${focusTopics.join(', ')}` : ''}${customInstructions ? `\nNotes: ${customInstructions}` : ''}${videoList}`;

    // Only add text materials section if there are any
    if (content) {
        prompt += `\n\nText Materials:\n${content}`;
    }

    return prompt;
}

/** Validate questions have required fields and filter out malformed questions */
function validateQuestions(questions) {
    return questions
        .filter(q => {
            // Basic validation
            if (!q.question || !q.type) return false;

            // Questions that require options
            const requiresOptions = ['multiple_choice', 'multiple_select', 'true_false'];
            if (requiresOptions.includes(q.type)) {
                // Must have at least 2 options
                if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
                    console.warn(`[Validation] Skipping ${q.type} question without valid options:`, q.question);
                    return false;
                }
                // true_false must have exactly 2 options
                if (q.type === 'true_false' && q.options.length !== 2) {
                    console.warn(`[Validation] Skipping true_false question without exactly 2 options:`, q.question);
                    return false;
                }
            }

            // Validate correctAnswer type matches question type
            if (q.type === 'multiple_select' && !Array.isArray(q.correctAnswer)) {
                console.warn(`[Validation] Skipping multiple_select question with non-array correctAnswer:`, q.question);
                return false;
            }
            if (q.type === 'fill_blank' && !Array.isArray(q.correctAnswer)) {
                console.warn(`[Validation] Skipping fill_blank question with non-array correctAnswer:`, q.question);
                return false;
            }

            return true;
        })
        .map(q => ({
            type: q.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer ?? '',
            explanation: q.explanation ?? '',
            points: q.points ?? 1,
            difficulty: q.difficulty ?? 'medium',
            topic: q.topic ?? '',
            hint: q.hint ?? '',
        }));
}

/**
 * Prepare file attachments from materials for Gemini
 * Supports YouTube URLs and uploaded files via Gemini File API
 */
function prepareFileAttachments(materials) {
    const files = [];

    for (const material of materials) {
        // YouTube videos - pass URL directly
        if (material.type === 'youtube' && material.youtube?.url) {
            files.push({
                type: 'youtube',
                url: material.youtube.url,
            });
        }
        // Uploaded video files - use Gemini File API URI
        else if (material.type === 'video' && material.file?.geminiUri && material.file?.mimeType) {
            files.push({
                type: 'file',
                uri: material.file.geminiUri,
                mimeType: material.file.mimeType,
            });
        }
        // Other uploaded files (PDFs, images, audio)
        else if (material.file?.geminiUri && material.file?.mimeType) {
            files.push({
                type: 'file',
                uri: material.file.geminiUri,
                mimeType: material.file.mimeType,
            });
        }
    }

    return files;
}

/**
 * Generate assessment questions using Gemini AI with streaming
 * @param {Object} options
 * @param {Array} options.materials - Array of material objects (with content, youtube, or file data)
 * @param {Object} options.settings - Generation settings
 * @param {Function} [options.onProgress] - Callback for streaming progress
 * @returns {Promise<Object>} Generated assessment data
 */
export async function generateAssessmentQuestions({ materials, settings, onProgress }) {
    // Ensure all file-based materials have valid (non-expired) Gemini files
    // This will re-upload from GridFS if the Gemini file has expired (48h limit)
    const geminiFileMap = await ensureGeminiFilesForMaterials(materials);

    // Update materials with fresh Gemini URIs where needed
    const materialsWithFreshFiles = materials.map(m => {
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

    // Filter materials - need text content, summary, YouTube URL, or uploaded file
    const usableMaterials = materialsWithFreshFiles.filter(m =>
        m.content?.text ||
        m.summary ||
        (m.type === 'youtube' && m.youtube?.url) ||
        (m.file?.geminiUri && m.file?.mimeType)
    );

    if (!usableMaterials.length) {
        throw new Error('No usable materials available. Add text, YouTube videos, or upload files.');
    }

    const prompt = buildPrompt(usableMaterials, settings);
    const fileAttachments = prepareFileAttachments(usableMaterials);

    // Determine what's being analyzed for the loading message
    const hasVideos = fileAttachments.some(f => f.type === 'youtube' || (f.type === 'file' && f.mimeType?.startsWith('video/')));
    const hasFiles = fileAttachments.some(f => f.type === 'file' && !f.mimeType?.startsWith('video/'));
    const hasText = usableMaterials.some(m => m.content?.text || m.summary);

    // Send initial metadata about what's being analyzed
    onProgress?.({
        type: 'metadata',
        analyzing: { hasVideos, hasFiles, hasText, materialCount: usableMaterials.length }
    });

    const stream = await generateContent({
        prompt,
        files: fileAttachments,
        model: GEMINI_MODELS.PRO,
        thinkingLevel: THINKING_LEVELS.LOW,
        includeThoughts: true, // Enable thought streaming
        responseSchema: AssessmentSchema,
        stream: true,
    });

    let jsonBuffer = '';
    let thinkingText = '';

    for await (const chunk of stream) {
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.thought) {
                thinkingText += part.text || '';
                onProgress?.({ type: 'thinking', content: part.text || '' });
            } else if (part.text) {
                jsonBuffer += part.text;
                onProgress?.({ type: 'content', content: part.text });
            }
        }
        if (chunk.text && !parts.length) {
            jsonBuffer += chunk.text;
            onProgress?.({ type: 'content', content: chunk.text });
        }
    }

    const parsed = JSON.parse(jsonBuffer);
    const questions = validateQuestions(parsed.questions || []);

    if (!questions.length) {
        throw new Error('No valid questions generated');
    }

    return {
        title: parsed.title || 'Generated Assessment',
        description: parsed.description || '',
        questions,
        thinking: thinkingText,
    };
}

/**
 * Grade a long-answer response using AI with structured output
 * @param {Object} options
 * @param {string} options.question - The question text
 * @param {string} options.expectedAnswer - Key points expected
 * @param {string} options.userAnswer - User's submitted answer
 * @param {number} options.maxPoints - Maximum points for this question
 * @returns {Promise<Object>} Grading result
 */
export async function gradeAnswerWithAI({ question, expectedAnswer, userAnswer, maxPoints = 1 }) {
    const prompt = `You are an expert teacher grading a student's answer.

Question: ${question}

Expected Answer/Key Points: ${expectedAnswer}

Student's Answer: ${userAnswer}

Maximum Points: ${maxPoints}

Grade the answer by:
1. Comparing it to the expected answer/key points
2. Assigning points (0 to ${maxPoints})
3. Determining if it's correct (>=70% of points = correct)
4. Providing constructive feedback
5. Rating your confidence in this grading (0-1)`;

    try {
        const response = await generateContent({
            prompt,
            model: GEMINI_MODELS.PRO,
            thinkingLevel: THINKING_LEVELS.LOW,
            includeThoughts: false,
            responseSchema: GradingSchema,
        });

        // Parse the structured JSON response
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || response.text;
        const result = JSON.parse(text);

        return {
            pointsEarned: Math.min(Math.max(0, result.pointsEarned || 0), maxPoints),
            isCorrect: result.isCorrect ?? false,
            feedback: result.feedback || 'No feedback provided.',
            confidence: Math.min(Math.max(0, result.confidence || 0), 1),
        };
    } catch (error) {
        console.error('[Grading] Error:', error);
        return {
            pointsEarned: 0,
            isCorrect: false,
            feedback: 'Unable to grade automatically. Please review manually.',
            confidence: 0,
        };
    }
}
