import mongoose from 'mongoose';

const VerificationTokenSchema = new mongoose.Schema({
    identifier: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        unique: true,
        required: true,
    },
    expires: {
        type: Date,
        required: true,
    },
});

// Compound unique index for identifier + token
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

// Prevent model recompilation in development
export const VerificationToken =
    mongoose.models.VerificationToken ||
    mongoose.model('VerificationToken', VerificationTokenSchema);
