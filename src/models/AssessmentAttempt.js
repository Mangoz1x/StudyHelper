import mongoose from 'mongoose';

/**
 * Answer Schema (embedded in AssessmentAttempt)
 */
const AnswerSchema = new mongoose.Schema({
    // Reference to the question index in the assessment
    questionIndex: {
        type: Number,
        required: true,
    },

    // User's answer - format depends on question type
    answer: mongoose.Schema.Types.Mixed,

    // Whether the answer was correct
    isCorrect: Boolean,

    // Points earned for this answer
    pointsEarned: {
        type: Number,
        default: 0,
    },

    // Time spent on this question (in seconds)
    timeSpent: Number,

    // For AI-graded questions (long_answer), feedback from AI
    aiFeedback: String,

    // Confidence score for AI grading (0-1)
    aiConfidence: Number,
});

/**
 * Assessment Attempt Model
 *
 * Records a user's attempt at an assessment
 */
const AssessmentAttemptSchema = new mongoose.Schema(
    {
        // The assessment being attempted
        assessmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Assessment',
            required: true,
            index: true,
        },

        // The user taking the assessment
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Project reference (denormalized for queries)
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },

        // Answers submitted
        answers: [AnswerSchema],

        // Attempt status
        status: {
            type: String,
            enum: ['in_progress', 'submitted', 'graded'],
            default: 'in_progress',
        },

        // Score information
        score: {
            earned: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            percentage: { type: Number, default: 0 },
        },

        // Timing
        startedAt: {
            type: Date,
            default: Date.now,
        },
        submittedAt: Date,
        gradedAt: Date,

        // Total time taken (in seconds)
        timeTaken: Number,

        // Question order (for randomized assessments)
        questionOrder: [Number],
    },
    {
        timestamps: true,
    }
);

// Indexes
AssessmentAttemptSchema.index({ assessmentId: 1, userId: 1 });
AssessmentAttemptSchema.index({ userId: 1, status: 1 });

// Prevent model recompilation in development
export const AssessmentAttempt = mongoose.models.AssessmentAttempt || mongoose.model('AssessmentAttempt', AssessmentAttemptSchema);
