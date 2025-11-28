/**
 * Ensure Gemini File Helper
 *
 * Checks if a material's Gemini file is still valid (not expired).
 * If expired or missing, re-uploads from GridFS storage.
 *
 * Gemini files expire after 48 hours.
 */

import { Material } from '@/models';
import { downloadFromGridFS, uploadFile, waitForFileProcessing } from '@/utils/clients';

// Gemini files expire after 48 hours, but we refresh at 47 hours to be safe
const GEMINI_FILE_TTL_MS = 47 * 60 * 60 * 1000; // 47 hours in milliseconds

/**
 * Check if a Gemini file has expired
 *
 * @param {Date|string} uploadedAt - When the file was uploaded to Gemini
 * @returns {boolean} True if expired or missing
 */
export function isGeminiFileExpired(uploadedAt) {
    if (!uploadedAt) return true;

    const uploadTime = new Date(uploadedAt).getTime();
    const now = Date.now();
    return now - uploadTime > GEMINI_FILE_TTL_MS;
}

/**
 * Ensure a material has a valid Gemini file URI
 *
 * If the Gemini file has expired or doesn't exist, re-uploads from GridFS.
 * Updates the material document with the new Gemini file info.
 *
 * @param {Object} material - Material document (must have file.gridfsId)
 * @returns {Promise<{uri: string, mimeType: string}>} Valid Gemini file reference
 * @throws {Error} If file cannot be retrieved or uploaded
 */
export async function ensureGeminiFile(material) {
    // If no file data, nothing to do
    if (!material.file) {
        return null;
    }

    // Check if we have a valid (non-expired) Gemini file
    const hasValidGeminiFile =
        material.file.geminiUri &&
        material.file.geminiUploadedAt &&
        !isGeminiFileExpired(material.file.geminiUploadedAt);

    if (hasValidGeminiFile) {
        return {
            uri: material.file.geminiUri,
            mimeType: material.file.mimeType,
        };
    }

    // Need to re-upload from GridFS
    if (!material.file.gridfsId) {
        throw new Error(`Material ${material._id} has no GridFS file to re-upload`);
    }

    console.log(`[Gemini] Re-uploading expired file for material ${material._id}`);

    // Download from GridFS
    const { buffer, mimeType } = await downloadFromGridFS(material.file.gridfsId);

    // Upload to Gemini
    const uploadedFile = await uploadFile({
        file: buffer,
        mimeType,
        displayName: material.file.originalName || material.name,
    });

    // Wait for processing if it's a video
    let processedFile = uploadedFile;
    if (mimeType.startsWith('video/')) {
        processedFile = await waitForFileProcessing(uploadedFile.name);
    }

    // Update the material with new Gemini file info
    await Material.updateOne(
        { _id: material._id },
        {
            $set: {
                'file.geminiUri': processedFile.uri,
                'file.geminiFileName': processedFile.name,
                'file.geminiUploadedAt': new Date(),
            },
        }
    );

    return {
        uri: processedFile.uri,
        mimeType,
    };
}

/**
 * Ensure all materials in a list have valid Gemini files
 *
 * Processes materials in parallel for efficiency.
 *
 * @param {Array} materials - Array of material documents
 * @returns {Promise<Map<string, {uri: string, mimeType: string}>>} Map of materialId -> Gemini file info
 */
export async function ensureGeminiFilesForMaterials(materials) {
    const results = new Map();

    // Process in parallel but with a concurrency limit
    const CONCURRENCY_LIMIT = 3;
    const queue = [...materials];

    const processNext = async () => {
        while (queue.length > 0) {
            const material = queue.shift();
            if (!material) continue;

            try {
                // Skip materials without files (text, links, youtube)
                if (!material.file?.gridfsId && !material.file?.geminiUri) {
                    continue;
                }

                const geminiFile = await ensureGeminiFile(material);
                if (geminiFile) {
                    results.set(material._id.toString(), geminiFile);
                }
            } catch (error) {
                console.error(`[Gemini] Failed to ensure file for material ${material._id}:`, error.message);
                // Continue processing other materials
            }
        }
    };

    // Start concurrent workers
    const workers = Array(CONCURRENCY_LIMIT).fill(null).map(() => processNext());
    await Promise.all(workers);

    return results;
}
