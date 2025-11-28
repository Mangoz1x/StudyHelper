import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sessionToken: {
            type: String,
            unique: true,
            required: true,
        },
        expires: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation in development
export const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);
