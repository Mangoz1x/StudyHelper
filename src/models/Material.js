import mongoose from 'mongoose';

/**
 * Material Model
 *
 * Represents uploaded course material (PDFs, videos, images, text, etc.)
 * that belongs to a project and is used for assessment generation.
 */
const MaterialSchema = new mongoose.Schema(
    {
        // Parent project
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
            index: true,
        },

        // Owner (denormalized for quick access)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // Material type
        type: {
            type: String,
            enum: [
                'pdf',           // PDF documents
                'image',         // Images (diagrams, notes, etc.)
                'video',         // Video files
                'youtube',       // YouTube video links
                'audio',         // Audio files
                'text',          // Plain text content
                'link',          // Web links
            ],
            required: true,
        },

        // Display name
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        // Optional description
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        // File information (for uploaded files)
        file: {
            // Original filename
            originalName: String,
            // MIME type
            mimeType: String,
            // File size in bytes
            size: Number,
            // Storage URL (S3, local, etc.)
            url: String,
            // Gemini file URI (for AI processing)
            geminiUri: String,
            // Gemini file name (for cleanup)
            geminiFileName: String,
        },

        // For YouTube links
        youtube: {
            videoId: String,
            url: String,
            thumbnailUrl: String,
            duration: Number, // in seconds
        },

        // For text content (notes, etc.)
        content: {
            text: String,
            format: {
                type: String,
                enum: ['plain', 'markdown', 'html'],
                default: 'plain',
            },
        },

        // For web links
        link: {
            url: String,
            title: String,
            description: String,
        },

        // Processing status
        status: {
            type: String,
            enum: [
                'pending',      // Awaiting processing
                'processing',   // Currently being processed by Gemini
                'ready',        // Ready to use
                'failed',       // Processing failed
            ],
            default: 'pending',
        },

        // Processing error message
        processingError: String,

        // AI-generated summary of the material
        summary: {
            type: String,
            maxlength: 2000,
        },

        // Extracted topics/keywords
        topics: [String],

        // Order within the project (for manual sorting)
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
MaterialSchema.index({ projectId: 1, order: 1 });
MaterialSchema.index({ projectId: 1, status: 1 });
MaterialSchema.index({ userId: 1, createdAt: -1 });

// Prevent model recompilation in development
export const Material = mongoose.models.Material || mongoose.model('Material', MaterialSchema);
