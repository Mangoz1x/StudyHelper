import mongoose from 'mongoose';

/**
 * StudyMessage Model
 *
 * Represents a message in a study chat session.
 * Supports user messages, assistant responses, tool calls, and inline questions.
 */

// Schema for inline quiz questions embedded in messages
const InlineQuestionSchema = new mongoose.Schema(
    {
        // Unique ID for this question instance
        id: {
            type: String,
            required: true,
        },

        // Question type
        type: {
            type: String,
            enum: ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'fill_blank'],
            required: true,
        },

        // The question text
        question: {
            type: String,
            required: true,
        },

        // Options for multiple choice / true_false
        options: [{
            id: String,
            text: String,
            isCorrect: Boolean,
        }],

        // Correct answer (format depends on type)
        correctAnswer: mongoose.Schema.Types.Mixed,

        // Explanation shown after answering
        explanation: String,

        // Optional hint
        hint: String,

        // User's response (if answered)
        userAnswer: mongoose.Schema.Types.Mixed,

        // When the user answered
        answeredAt: Date,

        // Whether the answer was correct
        isCorrect: Boolean,
    },
    { _id: false }
);

// Schema for tool calls made by the assistant
const ToolCallSchema = new mongoose.Schema(
    {
        // Tool type
        type: {
            type: String,
            enum: ['memory_create', 'memory_update', 'memory_delete', 'question_create'],
            required: true,
        },

        // Tool input data
        data: mongoose.Schema.Types.Mixed,

        // Result from executing the tool
        result: mongoose.Schema.Types.Mixed,
    },
    { _id: false }
);

// Schema for file attachments in user messages
const AttachmentSchema = new mongoose.Schema(
    {
        // Original filename
        name: {
            type: String,
            required: true,
        },

        // MIME type
        mimeType: {
            type: String,
            required: true,
        },

        // File size in bytes
        size: Number,

        // Gemini file URI (for AI processing)
        geminiUri: String,

        // Gemini file name (for cleanup)
        geminiFileName: String,
    },
    { _id: false }
);

const StudyMessageSchema = new mongoose.Schema(
    {
        // Parent chat
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyChat',
            required: true,
            index: true,
        },

        // Owner (denormalized for quick access)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Message role
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },

        // Message content (text)
        // Not required because assistant messages start empty during streaming
        content: {
            type: String,
            default: '',
        },

        // File attachments (for user messages)
        attachments: [AttachmentSchema],

        // Tool calls made by assistant
        toolCalls: [ToolCallSchema],

        // Inline question (if this message contains one)
        inlineQuestion: InlineQuestionSchema,

        // Message metadata
        metadata: {
            // Token usage for this message
            tokensUsed: Number,
            // Generation time in milliseconds
            generationTimeMs: Number,
        },
    },
    {
        timestamps: true,
    }
);

// Index for loading chat history in order
StudyMessageSchema.index({ chatId: 1, createdAt: 1 });

// Prevent model recompilation in development
export const StudyMessage = mongoose.models.StudyMessage || mongoose.model('StudyMessage', StudyMessageSchema);
