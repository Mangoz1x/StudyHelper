import { generateContent, GEMINI_MODELS, z } from '@/utils/clients';

/**
 * AI Answer Grading Utility
 *
 * Uses Gemini to evaluate short answer and long answer responses,
 * providing scores and detailed feedback.
 */

/**
 * Response schema for grading results
 */
const GradingResponseSchema = z.object({
    score: z.number().describe('Score from 0 to 100 representing how correct/complete the answer is'),
    isCorrect: z.boolean().describe('Whether the answer is substantially correct (score >= 70)'),
    feedback: z.string().describe('Constructive feedback explaining what was good and what could be improved'),
    keyPointsHit: z.array(z.string()).describe('Key points from the expected answer that the student addressed'),
    keyPointsMissed: z.array(z.string()).describe('Key points from the expected answer that the student missed or got wrong'),
});

/**
 * Grade a short or long answer using AI
 *
 * @param {Object} options
 * @param {string} options.question - The question text
 * @param {string} options.studentAnswer - The student's answer
 * @param {string} options.correctAnswer - The expected/model answer
 * @param {string} options.questionType - 'short_answer' or 'long_answer'
 * @param {string} [options.context] - Additional context about the topic
 * @returns {Promise<Object>} Grading result with score, feedback, etc.
 */
export async function gradeAnswer({
    question,
    studentAnswer,
    correctAnswer,
    questionType,
    context = '',
}) {
    const isLongAnswer = questionType === 'long_answer';

    const prompt = `You are an expert educational assessor grading a student's ${isLongAnswer ? 'long-form' : 'short'} answer.

## Question
${question}

## Expected/Model Answer
${correctAnswer}

## Student's Answer
${studentAnswer}

${context ? `## Additional Context\n${context}\n` : ''}

## Grading Instructions
${isLongAnswer ? `
For this long-form answer:
1. Evaluate the depth of analysis and reasoning
2. Check if key concepts are correctly applied
3. Assess the logical structure of the argument
4. Consider partial credit for partially correct reasoning
5. Be encouraging while pointing out areas for improvement
` : `
For this short answer:
1. Check if the core concept is understood
2. Allow for reasonable variations in wording
3. Focus on conceptual accuracy over exact phrasing
4. Be lenient with minor errors if the main idea is correct
`}

Grade the student's answer and provide constructive feedback. Be fair but thorough. A score of 70+ indicates a substantially correct answer.`;

    try {
        const response = await generateContent({
            prompt,
            model: GEMINI_MODELS.FLASH_25, // Use faster model for grading
            responseSchema: GradingResponseSchema,
        });

        // Parse the structured response - access via candidates[0].content.parts[0].text
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        const result = JSON.parse(text);

        return {
            success: true,
            score: result.score,
            isCorrect: result.isCorrect,
            feedback: result.feedback,
            keyPointsHit: result.keyPointsHit || [],
            keyPointsMissed: result.keyPointsMissed || [],
        };
    } catch (error) {
        console.error('[AI Grading] Error:', error);

        // Fallback to simple string matching if AI fails
        const studentLower = studentAnswer.trim().toLowerCase();
        const correctLower = correctAnswer.trim().toLowerCase();

        // Basic similarity check
        const words = correctLower.split(/\s+/);
        const matchedWords = words.filter(word =>
            word.length > 3 && studentLower.includes(word)
        );
        const similarity = words.length > 0 ? matchedWords.length / words.length : 0;

        return {
            success: false,
            score: Math.round(similarity * 100),
            isCorrect: similarity >= 0.5,
            feedback: 'Unable to provide detailed feedback at this time. Your answer has been evaluated based on keyword matching.',
            keyPointsHit: [],
            keyPointsMissed: [],
            error: error.message,
        };
    }
}

/**
 * Quick grade for fill-in-the-blank with fuzzy matching
 * Uses AI to determine if answers are semantically equivalent
 *
 * @param {Object} options
 * @param {Array<string>} options.studentAnswers - Array of student's answers for each blank
 * @param {Array<string>} options.correctAnswers - Array of correct answers for each blank
 * @returns {Promise<Object>} Grading result
 */
export async function gradeFillBlank({ studentAnswers, correctAnswers }) {
    // First try exact matching (case-insensitive)
    const exactMatches = studentAnswers.map((answer, i) =>
        answer.trim().toLowerCase() === correctAnswers[i].trim().toLowerCase()
    );

    // If all exact matches, return immediately
    if (exactMatches.every(match => match)) {
        return {
            success: true,
            score: 100,
            isCorrect: true,
            blankResults: exactMatches.map((match, i) => ({
                isCorrect: match,
                studentAnswer: studentAnswers[i],
                correctAnswer: correctAnswers[i],
            })),
            feedback: 'Perfect! All blanks filled correctly.',
        };
    }

    // For non-exact matches, use AI to check semantic equivalence
    const prompt = `Check if these student answers are semantically equivalent to the correct answers (they don't need to be exact matches, just convey the same meaning):

${studentAnswers.map((answer, i) => `Blank ${i + 1}:
- Student's answer: "${answer}"
- Correct answer: "${correctAnswers[i]}"`).join('\n\n')}

For each blank, determine if the student's answer is acceptable.`;

    try {
        const FillBlankSchema = z.object({
            results: z.array(z.object({
                blankNumber: z.number(),
                isAcceptable: z.boolean(),
                reason: z.string(),
            })),
            overallFeedback: z.string(),
        });

        const response = await generateContent({
            prompt,
            model: GEMINI_MODELS.FLASH_25,
            responseSchema: FillBlankSchema,
        });

        // Parse the structured response - access via candidates[0].content.parts[0].text
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
        const result = JSON.parse(text);
        const correctCount = result.results.filter(r => r.isAcceptable).length;
        const score = Math.round((correctCount / studentAnswers.length) * 100);

        return {
            success: true,
            score,
            isCorrect: score >= 70,
            blankResults: result.results.map((r, i) => ({
                isCorrect: r.isAcceptable,
                studentAnswer: studentAnswers[i],
                correctAnswer: correctAnswers[i],
                reason: r.reason,
            })),
            feedback: result.overallFeedback,
        };
    } catch (error) {
        console.error('[AI Fill Blank Grading] Error:', error);

        // Fallback to exact matching
        const correctCount = exactMatches.filter(Boolean).length;
        const score = Math.round((correctCount / studentAnswers.length) * 100);

        return {
            success: false,
            score,
            isCorrect: score === 100,
            blankResults: exactMatches.map((match, i) => ({
                isCorrect: match,
                studentAnswer: studentAnswers[i],
                correctAnswer: correctAnswers[i],
            })),
            feedback: 'Answers evaluated with exact matching.',
            error: error.message,
        };
    }
}
