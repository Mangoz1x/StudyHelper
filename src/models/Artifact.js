import mongoose from 'mongoose';

/**
 * Artifact Model
 *
 * Represents a rich, interactive study artifact created in chat.
 * Artifacts can be lessons (with embedded questions), study plans, or flashcard sets.
 */

// Schema for embedded quiz questions (same structure as InlineQuestion)
const EmbeddedQuestionSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['multiple_choice', 'multiple_select', 'true_false', 'short_answer', 'fill_blank'],
            required: true,
        },
        question: {
            type: String,
            required: true,
        },
        options: [{
            id: String,
            text: String,
            isCorrect: Boolean,
        }],
        correctAnswer: mongoose.Schema.Types.Mixed,
        explanation: String,
        hint: String,
        userAnswer: mongoose.Schema.Types.Mixed,
        answeredAt: Date,
        isCorrect: Boolean,
    },
    { _id: false }
);

// Schema for lesson sections (content or question)
const LessonSectionSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['content', 'question'],
            required: true,
        },
        // For content sections
        content: String,
        // For question sections
        question: EmbeddedQuestionSchema,
        // Track if section is still streaming
        isStreaming: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

// Schema for study plan items
const PlanItemSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        text: {
            type: String,
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        completedAt: Date,
        // Nested items (one level deep)
        children: [{
            id: String,
            text: String,
            completed: {
                type: Boolean,
                default: false,
            },
            completedAt: Date,
        }],
    },
    { _id: false }
);

// Schema for flashcards
const FlashcardSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true,
        },
        front: {
            type: String,
            required: true,
        },
        back: {
            type: String,
            required: true,
        },
        studied: {
            type: Boolean,
            default: false,
        },
        lastStudiedAt: Date,
    },
    { _id: false }
);

const ArtifactSchema = new mongoose.Schema(
    {
        // Parent chat where artifact was created
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyChat',
            required: true,
            index: true,
        },

        // Project this artifact belongs to (for project-level access)
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },

        // Owner
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Artifact type
        type: {
            type: String,
            enum: ['study_plan', 'lesson', 'flashcards'],
            required: true,
        },

        // Title of the artifact
        title: {
            type: String,
            required: true,
            maxlength: 200,
        },

        // Brief description
        description: {
            type: String,
            maxlength: 500,
        },

        // Content - structure depends on type
        content: {
            // For study_plan
            items: [PlanItemSchema],

            // For lesson
            sections: [LessonSectionSchema],

            // For flashcards
            cards: [FlashcardSchema],
        },

        // Status
        status: {
            type: String,
            enum: ['generating', 'active', 'archived'],
            default: 'generating',
        },

        // Version for optimistic updates
        version: {
            type: Number,
            default: 1,
        },

        // Who last edited
        lastEditedBy: {
            type: String,
            enum: ['user', 'assistant'],
            default: 'assistant',
        },

        // Message ID that created/updated this artifact (for linking in chat)
        sourceMessageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyMessage',
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
ArtifactSchema.index({ chatId: 1, createdAt: 1 });
ArtifactSchema.index({ projectId: 1, status: 1, updatedAt: -1 });
ArtifactSchema.index({ userId: 1, projectId: 1 });

// Prevent model recompilation in development
export const Artifact = mongoose.models.Artifact || mongoose.model('Artifact', ArtifactSchema);
