import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Material } from '@/models';
import { connectDB, downloadFromGridFS } from '@/utils/clients';

/**
 * GET /api/files/[fileId]
 *
 * Serve a file from GridFS storage
 * Supports optional thumbnail generation for images/videos
 *
 * Query params:
 * - thumbnail: boolean - Return a smaller version (for images)
 */
export async function GET(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { fileId } = await params;

        if (!fileId) {
            return NextResponse.json(
                { error: 'File ID is required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Find the material that owns this file to verify access
        const material = await Material.findOne({
            'file.gridfsId': fileId,
            userId: session.user.id,
        });

        if (!material) {
            return NextResponse.json(
                { error: 'File not found or access denied' },
                { status: 404 }
            );
        }

        // Download the file from GridFS
        const { buffer, mimeType } = await downloadFromGridFS(fileId);

        // Return the file with appropriate headers
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': mimeType,
                'Content-Length': buffer.length.toString(),
                'Cache-Control': 'private, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('File serve error:', error);
        return NextResponse.json(
            { error: 'Failed to serve file' },
            { status: 500 }
        );
    }
}
