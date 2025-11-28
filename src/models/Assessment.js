import mongoose from 'mongoose';

/**
 * Question Schema (embedded in Assessment)
 *
 * Supports multiple question types:
 * - multiple_choice: Single correct answer from options
 * - multiple_select: Multiple correct answers from options
 * - true_false: True or false question
 * - short_answer: Brief text response
 * - long_answer: Extended text response (essay)
 * - fill_blank: Fill in the blank(s)
 */
const QuestionSchema = new mongoose.Schema({
    // Question type
    type: {
        type: String,
        enum: [
            'multiple_choice',
            'multiple_select',
            'true_false',
            'short_answer',
            'long_answer',
            'fill_blank',
        ],
        required: true,
    },

    // The question text
    question: {
        type: String,
        required: true,
    },

    // For multiple choice / multiple select / true_false
    options: [{
        id: String,      // e.g., 'a', 'b', 'c', 'd'
        text: String,
        isCorrect: Boolean,
    }],

    // Correct answer(s) - format depends on question type
    // multiple_choice: single option id ('a')
    // multiple_select: array of option ids (['a', 'c'])
    // true_false: 'true' or 'false'
    // short_answer: expected answer text or array of acceptable answers
    // fill_blank: array of answers for each blank
    correctAnswer: mongoose.Schema.Types.Mixed,

    // Explanation shown after answering
    explanation: String,

    // Points for this question
    points: {
        type: Number,
        default: 1,
    },

    // Difficulty level
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium',
    },

    // Topic/category within the material
    topic: String,

    // Hint (optional, can be shown to user)
    hint: String,
});

/**
 * Assessment Model
 *
 * A generated assessment containing questions based on project materials
 */
const AssessmentSchema = new mongoose.Schema(
    {
        // Parent project
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

        // Assessment title
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // Description/instructions
        description: String,

        // Questions
        questions: [QuestionSchema],

        // Generation settings used
        settings: {
            // Total questions requested
            questionCount: Number,
            // Question types included
            questionTypes: [String],
            // Difficulty distribution
            difficulty: {
                type: String,
                enum: ['easy', 'medium', 'hard', 'mixed'],
            },
            // Topics to focus on (optional)
            focusTopics: [String],
            // Custom instructions given to AI
            customInstructions: String,
            // Material IDs used for generation
            materialIds: [mongoose.Schema.Types.ObjectId],
        },

        // Assessment metadata
        totalPoints: {
            type: Number,
            default: 0,
        },

        // Time limit in minutes (0 = no limit)
        timeLimit: {
            type: Number,
            default: 0,
        },

        // Status
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
        },

        // Statistics (updated when attempts are made)
        stats: {
            attemptCount: { type: Number, default: 0 },
            averageScore: { type: Number, default: 0 },
            highestScore: { type: Number, default: 0 },
            averageTime: { type: Number, default: 0 }, // in seconds
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
AssessmentSchema.index({ projectId: 1, createdAt: -1 });
AssessmentSchema.index({ userId: 1, createdAt: -1 });

// Calculate total points before saving
AssessmentSchema.pre('save', function () {
    if (this.questions && this.questions.length > 0) {
        this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    }
});

// Prevent model recompilation in development
export const Assessment = mongoose.models.Assessment || mongoose.model('Assessment', AssessmentSchema);
