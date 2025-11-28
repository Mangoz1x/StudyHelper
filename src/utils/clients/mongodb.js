import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    throw new Error('MONGO_URI environment variable is not defined');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose
 * Optimized for serverless environments (Vercel)
 * Uses global caching to reuse connections across hot reloads
 * @returns {Promise<typeof mongoose>} Mongoose instance
 */
export const connectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log('MongoDB connected successfully');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
};

/**
 * Get the current Mongoose instance
 * @returns {typeof mongoose} Mongoose instance
 */
export const getMongoose = () => mongoose;

/**
 * Check if database is connected
 * @returns {boolean} Connection status
 */
export const isDBConnected = () => cached.conn !== null;
