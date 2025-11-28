'use server';

import { auth } from '@/auth';
import { Project } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * Create a new project
 *
 * @param {Object} data - Project data
 * @param {string} data.name - Project name
 * @param {string} [data.description] - Project description
 * @param {string} [data.color] - Project color
 * @param {string} [data.icon] - Project icon
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function createProject({ name, description, color, icon }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return { error: 'Project name is required' };
        }

        if (name.length > 100) {
            return { error: 'Project name must be less than 100 characters' };
        }

        await connectDB();

        const project = await Project.create({
            userId: session.user.id,
            name: name.trim(),
            description: description?.trim(),
            color: color || '#2563eb',
            icon: icon || 'book',
        });

        return {
            data: {
                id: project._id.toString(),
                name: project.name,
                description: project.description,
                color: project.color,
                icon: project.icon,
                status: project.status,
                stats: project.stats,
                createdAt: project.createdAt,
            },
        };
    } catch (error) {
        console.error('createProject error:', error);
        return { error: 'Failed to create project' };
    }
}

/**
 * Get all projects for the current user
 *
 * @param {Object} [options]
 * @param {string} [options.status] - Filter by status ('active' | 'archived')
 * @returns {Promise<{data?: Array, error?: string}>}
 */
export async function getProjects({ status = 'active' } = {}) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        await connectDB();

        const query = { userId: session.user.id };
        if (status) {
            query.status = status;
        }

        const projects = await Project.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return {
            data: projects.map((project) => ({
                id: project._id.toString(),
                name: project.name,
                description: project.description,
                color: project.color,
                icon: project.icon,
                status: project.status,
                stats: {
                    materialCount: project.stats?.materialCount || 0,
                    assessmentCount: project.stats?.assessmentCount || 0,
                },
                createdAt: project.createdAt?.toISOString?.() || project.createdAt,
                updatedAt: project.updatedAt?.toISOString?.() || project.updatedAt,
            })),
        };
    } catch (error) {
        console.error('getProjects error:', error);
        return { error: 'Failed to fetch projects' };
    }
}

/**
 * Get a single project by ID
 *
 * @param {string} projectId - The project ID
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function getProject(projectId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId) {
            return { error: 'Project ID is required' };
        }

        await connectDB();

        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        }).lean();

        if (!project) {
            return { error: 'Project not found' };
        }

        return {
            data: {
                id: project._id.toString(),
                name: project.name,
                description: project.description,
                color: project.color,
                icon: project.icon,
                status: project.status,
                stats: {
                    materialCount: project.stats?.materialCount || 0,
                    assessmentCount: project.stats?.assessmentCount || 0,
                },
                settings: project.settings || {},
                createdAt: project.createdAt?.toISOString?.() || project.createdAt,
                updatedAt: project.updatedAt?.toISOString?.() || project.updatedAt,
            },
        };
    } catch (error) {
        console.error('getProject error:', error);
        return { error: 'Failed to fetch project' };
    }
}

/**
 * Update a project
 *
 * @param {string} projectId - The project ID
 * @param {Object} data - Update data
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function updateProject(projectId, data) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId) {
            return { error: 'Project ID is required' };
        }

        await connectDB();

        // Only allow updating specific fields
        const allowedFields = ['name', 'description', 'color', 'icon', 'status', 'settings'];
        const updateData = {};

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        }

        if (updateData.name) {
            updateData.name = updateData.name.trim();
            if (updateData.name.length === 0) {
                return { error: 'Project name cannot be empty' };
            }
            if (updateData.name.length > 100) {
                return { error: 'Project name must be less than 100 characters' };
            }
        }

        const project = await Project.findOneAndUpdate(
            { _id: projectId, userId: session.user.id },
            { $set: updateData },
            { new: true }
        ).lean();

        if (!project) {
            return { error: 'Project not found' };
        }

        return {
            data: {
                id: project._id.toString(),
                name: project.name,
                description: project.description,
                color: project.color,
                icon: project.icon,
                status: project.status,
                stats: project.stats,
                settings: project.settings,
                updatedAt: project.updatedAt,
            },
        };
    } catch (error) {
        console.error('updateProject error:', error);
        return { error: 'Failed to update project' };
    }
}

/**
 * Delete a project and all its materials
 *
 * @param {string} projectId - The project ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
export async function deleteProject(projectId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        if (!projectId) {
            return { error: 'Project ID is required' };
        }

        await connectDB();

        // Import Material here to avoid circular dependency
        const { Material } = await import('@/models');

        // Delete all materials associated with the project
        await Material.deleteMany({ projectId, userId: session.user.id });

        // Delete the project
        const result = await Project.findOneAndDelete({
            _id: projectId,
            userId: session.user.id,
        });

        if (!result) {
            return { error: 'Project not found' };
        }

        return { success: true };
    } catch (error) {
        console.error('deleteProject error:', error);
        return { error: 'Failed to delete project' };
    }
}
