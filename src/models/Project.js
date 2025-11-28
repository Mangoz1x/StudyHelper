import mongoose from 'mongoose';

/**
 * Project Model
 *
 * Represents a study project that contains course materials
 * and generates assessments for the user.
 */
const ProjectSchema = new mongoose.Schema(
    {
        // Owner of the project
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Project details
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        // Project icon/color for UI
        color: {
            type: String,
            default: '#2563eb', // Blue
        },
        icon: {
            type: String,
            default: 'book', // Lucide icon name
        },

        // Project status
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
        },

        // Statistics (updated when materials are added/processed)
        stats: {
            materialCount: { type: Number, default: 0 },
            assessmentCount: { type: Number, default: 0 },
            totalStudyTime: { type: Number, default: 0 }, // in minutes
        },

        // Settings for assessment generation
        settings: {
            // Default difficulty for generated assessments
            defaultDifficulty: {
                type: String,
                enum: ['easy', 'medium', 'hard', 'mixed'],
                default: 'medium',
            },
            // Default number of questions
            defaultQuestionCount: {
                type: Number,
                default: 10,
                min: 1,
                max: 50,
            },
            // Question types to include
            questionTypes: {
                type: [String],
                default: ['multiple_choice', 'true_false', 'short_answer'],
            },
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for user's projects
ProjectSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Prevent model recompilation in development
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
