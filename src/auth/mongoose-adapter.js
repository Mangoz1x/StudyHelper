/**
 * Custom Mongoose Adapter for NextAuth.js v5
 *
 * This adapter connects NextAuth to MongoDB via Mongoose,
 * avoiding version conflicts with the official MongoDB adapter.
 */

import { User, Account, Session, VerificationToken } from '@/models';

/**
 * Converts MongoDB _id to string id for NextAuth
 */
const formatUser = (user) => {
    if (!user) return null;
    const { _id, ...rest } = user.toObject ? user.toObject() : user;
    return {
        id: _id.toString(),
        ...rest,
    };
};

const formatAccount = (account) => {
    if (!account) return null;
    const { _id, userId, ...rest } = account.toObject ? account.toObject() : account;
    return {
        id: _id.toString(),
        userId: userId.toString(),
        ...rest,
    };
};

const formatSession = (session) => {
    if (!session) return null;
    const { _id, userId, ...rest } = session.toObject ? session.toObject() : session;
    return {
        id: _id.toString(),
        userId: userId.toString(),
        ...rest,
    };
};

/**
 * Mongoose Adapter for NextAuth
 * Implements the required adapter interface
 */
export function MongooseAdapter() {
    return {
        async createUser(data) {
            const user = await User.create(data);
            return formatUser(user);
        },

        async getUser(id) {
            const user = await User.findById(id);
            return formatUser(user);
        },

        async getUserByEmail(email) {
            const user = await User.findOne({ email });
            return formatUser(user);
        },

        async getUserByAccount({ provider, providerAccountId }) {
            const account = await Account.findOne({ provider, providerAccountId });
            if (!account) return null;

            const user = await User.findById(account.userId);
            return formatUser(user);
        },

        async updateUser({ id, ...data }) {
            const user = await User.findByIdAndUpdate(id, data, { new: true });
            return formatUser(user);
        },

        async deleteUser(id) {
            await Promise.all([
                User.findByIdAndDelete(id),
                Account.deleteMany({ userId: id }),
                Session.deleteMany({ userId: id }),
            ]);
        },

        async linkAccount(data) {
            const account = await Account.create(data);
            return formatAccount(account);
        },

        async unlinkAccount({ provider, providerAccountId }) {
            await Account.findOneAndDelete({ provider, providerAccountId });
        },

        async createSession(data) {
            const session = await Session.create(data);
            return formatSession(session);
        },

        async getSessionAndUser(sessionToken) {
            const session = await Session.findOne({ sessionToken });
            if (!session) return null;

            const user = await User.findById(session.userId);
            if (!user) return null;

            return {
                session: formatSession(session),
                user: formatUser(user),
            };
        },

        async updateSession({ sessionToken, ...data }) {
            const session = await Session.findOneAndUpdate(
                { sessionToken },
                data,
                { new: true }
            );
            return formatSession(session);
        },

        async deleteSession(sessionToken) {
            await Session.findOneAndDelete({ sessionToken });
        },

        async createVerificationToken(data) {
            const token = await VerificationToken.create(data);
            const { _id, ...rest } = token.toObject();
            return rest;
        },

        async useVerificationToken({ identifier, token }) {
            const verificationToken = await VerificationToken.findOneAndDelete({
                identifier,
                token,
            });
            if (!verificationToken) return null;

            const { _id, ...rest } = verificationToken.toObject();
            return rest;
        },
    };
}
