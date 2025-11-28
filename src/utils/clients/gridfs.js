/**
 * MongoDB GridFS File Storage
 *
 * Stores files in MongoDB GridFS for persistent storage.
 * Files can be retrieved and re-uploaded to Gemini on demand.
 */

import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { connectDB } from './mongodb';

let bucket = null;

/**
 * Get the GridFS bucket instance
 * @returns {Promise<GridFSBucket>}
 */
export const getGridFSBucket = async () => {
    if (bucket) {
        return bucket;
    }

    await connectDB();
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, { bucketName: 'materials' });
    return bucket;
};

/**
 * Upload a file to GridFS
 *
 * @param {Object} options
 * @param {Buffer} options.buffer - File buffer
 * @param {string} options.filename - Original filename
 * @param {string} options.mimeType - MIME type
 * @param {Object} [options.metadata] - Additional metadata (userId, projectId, etc.)
 * @returns {Promise<{fileId: string, filename: string}>}
 */
export const uploadToGridFS = async ({ buffer, filename, mimeType, metadata = {} }) => {
    const gridfs = await getGridFSBucket();

    return new Promise((resolve, reject) => {
        const uploadStream = gridfs.openUploadStream(filename, {
            contentType: mimeType,
            metadata: {
                ...metadata,
                uploadedAt: new Date(),
            },
        });

        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
            resolve({
                fileId: uploadStream.id.toString(),
                filename: uploadStream.filename,
            });
        });

        uploadStream.end(buffer);
    });
};

/**
 * Download a file from GridFS
 *
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<{buffer: Buffer, filename: string, mimeType: string, metadata: Object}>}
 */
export const downloadFromGridFS = async (fileId) => {
    const gridfs = await getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);

    // Get file info first
    const files = await gridfs.find({ _id: objectId }).toArray();
    if (files.length === 0) {
        throw new Error('File not found in GridFS');
    }

    const fileInfo = files[0];

    // Download the file
    return new Promise((resolve, reject) => {
        const chunks = [];
        const downloadStream = gridfs.openDownloadStream(objectId);

        downloadStream.on('data', (chunk) => chunks.push(chunk));
        downloadStream.on('error', reject);
        downloadStream.on('end', () => {
            resolve({
                buffer: Buffer.concat(chunks),
                filename: fileInfo.filename,
                mimeType: fileInfo.contentType,
                metadata: fileInfo.metadata || {},
            });
        });
    });
};

/**
 * Delete a file from GridFS
 *
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
export const deleteFromGridFS = async (fileId) => {
    const gridfs = await getGridFSBucket();
    const objectId = new mongoose.Types.ObjectId(fileId);
    await gridfs.delete(objectId);
};

/**
 * Check if a file exists in GridFS
 *
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<boolean>}
 */
export const fileExistsInGridFS = async (fileId) => {
    try {
        const gridfs = await getGridFSBucket();
        const objectId = new mongoose.Types.ObjectId(fileId);
        const files = await gridfs.find({ _id: objectId }).toArray();
        return files.length > 0;
    } catch {
        return false;
    }
};
