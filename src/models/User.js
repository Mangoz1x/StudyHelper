import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true, // Allows null values while maintaining uniqueness
            lowercase: true,
            trim: true,
        },
        emailVerified: {
            type: Date,
            default: null,
        },
        image: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent model recompilation in development
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
