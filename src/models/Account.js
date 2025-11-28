import mongoose from 'mongoose';

const AccountSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            required: true, // 'oauth', 'oidc', 'email', 'credentials'
        },
        provider: {
            type: String,
            required: true, // 'google', 'github', etc.
        },
        providerAccountId: {
            type: String,
            required: true,
        },
        refresh_token: String,
        access_token: String,
        expires_at: Number,
        token_type: String,
        scope: String,
        id_token: String,
        session_state: String,
    },
    {
        timestamps: true,
    }
);

// Compound unique index for provider + providerAccountId
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

// Prevent model recompilation in development
export const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
