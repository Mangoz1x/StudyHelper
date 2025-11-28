import { generateContent, GEMINI_MODELS, THINKING_LEVELS, z } from '@/utils/clients';

/**
 * Zod schema for assessment structured output
 * @see https://ai.google.dev/gemini-api/docs/structured-output
 */
const AssessmentSchema = z.object({
    title: z.string(),
    description: z.string(),
    questions: z.array(z.object({
        type: z.enum(['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'long_answer', 'fill_blank']),
        question: z.string(),
        options: z.array(z.object({
            id: z.string(),
            text: z.string(),
            isCorrect: z.boolean(),
        })).optional(),
        correctAnswer: z.union([z.string(), z.array(z.string()), z.boolean()]),
        explanation: z.string(),
        points: z.number().default(1),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        topic: z.string().optional(),
        hint: z.string().optional(),
    })),
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

/** Validate questions have required fields */
function validateQuestions(questions) {
    return questions.filter(q => q.question && q.type).map(q => ({
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
    // Filter materials - need text content, summary, YouTube URL, or uploaded file
    const usableMaterials = materials.filter(m =>
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
