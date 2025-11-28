import { z } from 'zod';

/**
 * Study Mode Tool Definitions
 *
 * Defines the tools available to the AI tutor during study mode conversations.
 * These are converted to Gemini function declarations for tool calling.
 */

/**
 * Tool definitions with Zod schemas for validation
 */
export const STUDY_MODE_TOOLS = {
    memory_create: {
        name: 'memory_create',
        description:
            'Save an important observation about the student for future sessions. Use SPARINGLY - only for significant discoveries about the student (not every interaction). Do not create memories just because the student asks a question.',
        parameters: z.object({
            content: z
                .string()
                .max(500)
                .describe('The memory content to save - be concise but specific'),
            category: z
                .enum([
                    'preference',
                    'understanding',
                    'weakness',
                    'strength',
                    'goal',
                    'context',
                    'other',
                ])
                .describe('Category of the memory'),
            importance: z
                .number()
                .min(1)
                .max(5)
                .default(3)
                .describe('Importance level (1=low, 5=critical)'),
        }),
    },

    memory_update: {
        name: 'memory_update',
        description:
            'Update an existing memory with new or refined information. Use when you learn something that changes a previous observation.',
        parameters: z.object({
            memoryId: z.string().describe('ID of the memory to update'),
            content: z.string().max(500).describe('Updated content for the memory'),
        }),
    },

    memory_delete: {
        name: 'memory_delete',
        description:
            'Delete a memory that is no longer relevant or accurate. Use sparingly.',
        parameters: z.object({
            memoryId: z.string().describe('ID of the memory to delete'),
        }),
    },

    question_create: {
        name: 'question_create',
        description:
            'ONLY use this tool when the student EXPLICITLY asks to be quizzed or tested (e.g., "quiz me", "test me", "ask me a question"). Do NOT use this tool automatically after explanations. If you think a quiz would help, ASK the student first in your text response instead of creating a question.',
        parameters: z.object({
            type: z
                .enum(['multiple_choice', 'true_false', 'short_answer', 'fill_blank'])
                .describe('Type of question'),
            question: z.string().describe('The question text'),
            options: z
                .array(
                    z.object({
                        id: z.string().describe('Option identifier (a, b, c, d or true, false)'),
                        text: z.string().describe('Option text'),
                        isCorrect: z.boolean().describe('Whether this option is correct'),
                    })
                )
                .optional()
                .describe(
                    'Required for multiple_choice (4 options) and true_false (2 options). Not used for short_answer or fill_blank.'
                ),
            correctAnswer: z
                .union([z.string(), z.array(z.string())])
                .describe(
                    'The correct answer. String for multiple_choice/true_false/short_answer, array of strings for fill_blank (one per blank)'
                ),
            explanation: z
                .string()
                .describe('Explanation shown after the student answers - explain why the answer is correct'),
            hint: z.string().optional().describe('Optional hint the student can reveal'),
        }),
    },
};

/**
 * Convert tool definitions to Gemini function declarations format
 * @returns {Array} Array of function declarations for Gemini
 */
export function buildFunctionDeclarations() {
    return Object.values(STUDY_MODE_TOOLS).map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: z.toJSONSchema(tool.parameters),
    }));
}

/**
 * Get a specific tool definition by name
 * @param {string} name - Tool name
 * @returns {Object|null} Tool definition or null
 */
export function getTool(name) {
    return STUDY_MODE_TOOLS[name] || null;
}

/**
 * Validate tool call data against its schema
 * @param {string} toolName - Name of the tool
 * @param {Object} data - Data to validate
 * @returns {Object} Validated and parsed data
 * @throws {Error} If validation fails
 */
export function validateToolCall(toolName, data) {
    const tool = STUDY_MODE_TOOLS[toolName];
    if (!tool) {
        throw new Error(`Unknown tool: ${toolName}`);
    }
    return tool.parameters.parse(data);
}
