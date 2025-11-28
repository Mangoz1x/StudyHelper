import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose
 * Uses lazy initialization pattern - connection established only when called
 * @returns {Promise<typeof mongoose>} Mongoose instance
 */
export const connectDB = async () => {
    if (isConnected) {
        return mongoose;
    }

    const MONGODB_URI = process.env.MONGO_URI;

    if (!MONGODB_URI) {
        throw new Error('MONGO_URI environment variable is not defined');
    }

    try {
        const db = await mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        });

        isConnected = db.connections[0].readyState === 1;
        console.log('MongoDB connected successfully');
        return mongoose;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
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
export const isDBConnected = () => isConnected;
