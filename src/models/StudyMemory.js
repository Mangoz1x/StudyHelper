import mongoose from 'mongoose';

/**
 * StudyMemory Model
 *
 * Represents a memory saved by the AI tutor about a student.
 * Memories are project-scoped and shared across all chats in that project.
 * The AI can create, update, and delete memories during conversations.
 */
const StudyMemorySchema = new mongoose.Schema(
    {
        // Parent project (memories are project-scoped, not chat-scoped)
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

        // Memory content
        content: {
            type: String,
            required: true,
            maxlength: 1000,
        },

        // Category of memory for organization
        category: {
            type: String,
            enum: [
                'preference',     // Learning style preferences
                'understanding',  // What the student understands well
                'weakness',       // Areas needing improvement
                'strength',       // Student's strong points
                'goal',           // Student's learning goals
                'context',        // Background information
                'other',          // Miscellaneous
            ],
            default: 'other',
        },

        // Which chat this memory was created in (for reference)
        sourceChatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'StudyChat',
        },

        // Importance score (for potential future pruning)
        importance: {
            type: Number,
            default: 3,
            min: 1,
            max: 5,
        },

        // Whether memory is active (soft delete)
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fetching active project memories
StudyMemorySchema.index({ projectId: 1, userId: 1, isActive: 1 });

// Index for filtering by category
StudyMemorySchema.index({ projectId: 1, category: 1 });

// Prevent model recompilation in development
export const StudyMemory = mongoose.models.StudyMemory || mongoose.model('StudyMemory', StudyMemorySchema);
