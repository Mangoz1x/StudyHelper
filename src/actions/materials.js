'use server';

import { auth } from '@/auth';
import { Project, Material } from '@/models';
import { connectDB, uploadFile, waitForFileProcessing, deleteFile as deleteGeminiFile } from '@/utils/clients';
import { getYouTubeMetadata, extractYouTubeVideoId } from '@/utils/youtube';

/**
 * Add a text material to a project
 *
 * @param {Object} data
 * @param {string} data.projectId - Project ID
 * @param {string} data.name - Material name
 * @param {string} data.content - Text content
 * @param {string} [data.description] - Optional description
 * @param {string} [data.format] - Content format ('plain' | 'markdown' | 'html')
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function addTextMaterial({ projectId, name, content, description, format = 'plain' }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId || !name || !content) {
            return { error: 'Project ID, name, and content are required' };
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return { error: 'Project not found' };
        }

        // Get current max order
        const lastMaterial = await Material.findOne({ projectId })
            .sort({ order: -1 })
            .select('order');
        const order = (lastMaterial?.order ?? -1) + 1;

        const material = await Material.create({
            projectId,
            userId: session.user.id,
            type: 'text',
            name: name.trim(),
            description: description?.trim(),
            content: {
                text: content,
                format,
            },
            status: 'ready',
            order,
        });

        // Update project stats
        await Project.updateOne(
            { _id: projectId },
            { $inc: { 'stats.materialCount': 1 } }
        );

        return {
            data: {
                id: material._id.toString(),
                type: material.type,
                name: material.name,
                description: material.description,
                status: material.status,
                order: material.order,
                createdAt: material.createdAt?.toISOString?.() || material.createdAt,
            },
        };
    } catch (error) {
        console.error('addTextMaterial error:', error);
        return { error: 'Failed to add text material' };
    }
}

/**
 * Add a YouTube video material
 *
 * @param {Object} data
 * @param {string} data.projectId - Project ID
 * @param {string} data.url - YouTube URL
 * @param {string} [data.name] - Optional custom name
 * @param {string} [data.description] - Optional description
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function addYouTubeMaterial({ projectId, url, name, description }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId || !url) {
            return { error: 'Project ID and YouTube URL are required' };
        }

        // Extract video ID from various YouTube URL formats
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
            return { error: 'Invalid YouTube URL' };
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return { error: 'Project not found' };
        }

        // Get current max order
        const lastMaterial = await Material.findOne({ projectId })
            .sort({ order: -1 })
            .select('order');
        const order = (lastMaterial?.order ?? -1) + 1;

        // Fetch video metadata
        const metadata = await getYouTubeMetadata(videoId);
        const videoTitle = name?.trim() || metadata?.title || `YouTube Video: ${videoId}`;

        const material = await Material.create({
            projectId,
            userId: session.user.id,
            type: 'youtube',
            name: videoTitle,
            description: description?.trim(),
            youtube: {
                videoId,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                duration: metadata?.duration,
            },
            status: 'ready',
            order,
        });

        // Update project stats
        await Project.updateOne(
            { _id: projectId },
            { $inc: { 'stats.materialCount': 1 } }
        );

        return {
            data: {
                id: material._id.toString(),
                type: material.type,
                name: material.name,
                description: material.description,
                youtube: material.youtube,
                status: material.status,
                order: material.order,
                createdAt: material.createdAt?.toISOString?.() || material.createdAt,
            },
        };
    } catch (error) {
        console.error('addYouTubeMaterial error:', error);
        return { error: 'Failed to add YouTube video' };
    }
}

/**
 * Add a web link material
 *
 * @param {Object} data
 * @param {string} data.projectId - Project ID
 * @param {string} data.url - Web URL
 * @param {string} [data.name] - Optional custom name
 * @param {string} [data.description] - Optional description
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function addLinkMaterial({ projectId, url, name, description }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId || !url) {
            return { error: 'Project ID and URL are required' };
        }

        // Validate URL
        try {
            new URL(url);
        } catch {
            return { error: 'Invalid URL' };
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return { error: 'Project not found' };
        }

        // Get current max order
        const lastMaterial = await Material.findOne({ projectId })
            .sort({ order: -1 })
            .select('order');
        const order = (lastMaterial?.order ?? -1) + 1;

        const material = await Material.create({
            projectId,
            userId: session.user.id,
            type: 'link',
            name: name?.trim() || url,
            description: description?.trim(),
            link: {
                url,
            },
            status: 'ready',
            order,
        });

        // Update project stats
        await Project.updateOne(
            { _id: projectId },
            { $inc: { 'stats.materialCount': 1 } }
        );

        return {
            data: {
                id: material._id.toString(),
                type: material.type,
                name: material.name,
                description: material.description,
                link: material.link,
                status: material.status,
                order: material.order,
                createdAt: material.createdAt?.toISOString?.() || material.createdAt,
            },
        };
    } catch (error) {
        console.error('addLinkMaterial error:', error);
        return { error: 'Failed to add link' };
    }
}

/**
 * Get all materials for a project
 *
 * @param {string} projectId - Project ID
 * @returns {Promise<{data?: Array, error?: string}>}
 */
export async function getMaterials(projectId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId) {
            return { error: 'Project ID is required' };
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return { error: 'Project not found' };
        }

        const materials = await Material.find({ projectId })
            .sort({ order: 1 })
            .lean();

        return {
            data: materials.map((m) => ({
                id: m._id.toString(),
                type: m.type,
                name: m.name,
                description: m.description,
                file: m.file ? {
                    originalName: m.file.originalName,
                    mimeType: m.file.mimeType,
                    size: m.file.size,
                    url: m.file.url,
                    gridfsId: m.file.gridfsId,
                    geminiUri: m.file.geminiUri,
                    geminiFileName: m.file.geminiFileName,
                } : undefined,
                youtube: m.youtube ? {
                    videoId: m.youtube.videoId,
                    url: m.youtube.url,
                    thumbnailUrl: m.youtube.thumbnailUrl,
                    duration: m.youtube.duration,
                } : undefined,
                content: m.content ? {
                    text: m.content.text,
                    format: m.content.format,
                } : undefined,
                link: m.link ? {
                    url: m.link.url,
                    title: m.link.title,
                    description: m.link.description,
                } : undefined,
                status: m.status,
                processingError: m.processingError,
                summary: m.summary,
                topics: m.topics ? [...m.topics] : [],
                order: m.order,
                createdAt: m.createdAt?.toISOString?.() || m.createdAt,
                updatedAt: m.updatedAt?.toISOString?.() || m.updatedAt,
            })),
        };
    } catch (error) {
        console.error('getMaterials error:', error);
        return { error: 'Failed to fetch materials' };
    }
}

/**
 * Delete a material
 *
 * @param {string} materialId - Material ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
export async function deleteMaterial(materialId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!materialId) {
            return { error: 'Material ID is required' };
        }

        await connectDB();

        const material = await Material.findOne({
            _id: materialId,
            userId: session.user.id,
        });

        if (!material) {
            return { error: 'Material not found' };
        }

        // Delete from Gemini if it has a file
        if (material.file?.geminiFileName) {
            try {
                await deleteGeminiFile(material.file.geminiFileName);
            } catch (err) {
                console.error('Failed to delete Gemini file:', err);
                // Continue anyway
            }
        }

        // Delete the material
        await Material.deleteOne({ _id: materialId });

        // Update project stats
        await Project.updateOne(
            { _id: material.projectId },
            { $inc: { 'stats.materialCount': -1 } }
        );

        return { success: true };
    } catch (error) {
        console.error('deleteMaterial error:', error);
        return { error: 'Failed to delete material' };
    }
}

/**
 * Update material order (for drag and drop reordering)
 *
 * @param {string} projectId - Project ID
 * @param {Array<{id: string, order: number}>} items - Array of material IDs with new order
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
export async function updateMaterialOrder(projectId, items) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId || !Array.isArray(items)) {
            return { error: 'Project ID and items array are required' };
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return { error: 'Project not found' };
        }

        // Update each material's order
        const bulkOps = items.map(({ id, order }) => ({
            updateOne: {
                filter: { _id: id, projectId, userId: session.user.id },
                update: { $set: { order } },
            },
        }));

        await Material.bulkWrite(bulkOps);

        return { success: true };
    } catch (error) {
        console.error('updateMaterialOrder error:', error);
        return { error: 'Failed to update material order' };
    }
}

