import mongoose from 'mongoose';

/**
 * StudyChat Model
 *
 * Represents a chat session within a project's study mode.
 * Users can have multiple chats per project, each with its own conversation history.
 */
const StudyChatSchema = new mongoose.Schema(
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

        // Chat title (auto-generated from first message or user-set)
        title: {
            type: String,
            default: 'New Chat',
            trim: true,
            maxlength: 200,
        },

        // Chat status
        status: {
            type: String,
            enum: ['active', 'archived'],
            default: 'active',
        },

        // Message count (denormalized for display)
        messageCount: {
            type: Number,
            default: 0,
        },

        // Last activity timestamp (for sorting)
        lastActivityAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for efficient queries
StudyChatSchema.index({ projectId: 1, status: 1, lastActivityAt: -1 });
StudyChatSchema.index({ userId: 1, lastActivityAt: -1 });

// Prevent model recompilation in development
export const StudyChat = mongoose.models.StudyChat || mongoose.model('StudyChat', StudyChatSchema);
