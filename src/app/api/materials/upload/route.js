import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Project, Material } from '@/models';
import { connectDB, uploadFile, waitForFileProcessing, transcribeWithWhisper, isGroqConfigured } from '@/utils/clients';

/**
 * POST /api/materials/upload
 *
 * Upload a file material with optional transcription
 *
 * Form data:
 * - file: File - The file to upload
 * - projectId: string - Project ID
 * - name: string (optional) - Custom name
 * - description: string (optional) - Description
 * - transcriptOnly: boolean (optional) - If true, extract transcript instead of full file
 */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized: Please sign in' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const projectId = formData.get('projectId');
        const name = formData.get('name');
        const description = formData.get('description');
        const transcriptOnly = formData.get('transcriptOnly') === 'true';

        if (!file || !projectId) {
            return NextResponse.json(
                { error: 'File and project ID are required' },
                { status: 400 }
            );
        }

        // Validate file type
        const mimeType = file.type;
        const isVideo = mimeType.startsWith('video/');
        const isAudio = mimeType.startsWith('audio/');

        if (transcriptOnly && !isVideo && !isAudio) {
            return NextResponse.json(
                { error: 'Transcript mode only works with video and audio files' },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Get current max order
        const lastMaterial = await Material.findOne({ projectId })
            .sort({ order: -1 })
            .select('order');
        const order = (lastMaterial?.order ?? -1) + 1;

        const fileName = name?.trim() || file.name;

        // If transcript mode is requested for video/audio
        if (transcriptOnly && (isVideo || isAudio)) {
            // Check if GROQ is configured
            if (!isGroqConfigured()) {
                return NextResponse.json(
                    { error: 'Transcription service is not configured. Please add GROQ_API_KEY to your environment.' },
                    { status: 503 }
                );
            }

            // Create material in processing state
            const material = await Material.create({
                projectId,
                userId: session.user.id,
                type: isVideo ? 'video' : 'audio',
                name: fileName,
                description: description?.trim(),
                file: {
                    originalName: file.name,
                    mimeType,
                    size: file.size,
                },
                status: 'processing',
                order,
            });

            // Update project stats
            await Project.updateOne(
                { _id: projectId },
                { $inc: { 'stats.materialCount': 1 } }
            );

            try {
                // Convert file to buffer for Whisper
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Transcribe with Whisper
                const transcriptionResult = await transcribeWithWhisper({
                    file: buffer,
                    filename: file.name,
                });

                // Update material with transcript
                await Material.updateOne(
                    { _id: material._id },
                    {
                        $set: {
                            status: 'ready',
                            content: {
                                text: transcriptionResult.text,
                                format: 'plain',
                                source: 'whisper_transcript',
                            },
                        },
                    }
                );

                return NextResponse.json({
                    data: {
                        id: material._id.toString(),
                        type: material.type,
                        name: material.name,
                        description: material.description,
                        file: {
                            originalName: file.name,
                            mimeType,
                            size: file.size,
                        },
                        content: {
                            text: transcriptionResult.text,
                            format: 'plain',
                            source: 'whisper_transcript',
                        },
                        status: 'ready',
                        order: material.order,
                        createdAt: material.createdAt?.toISOString?.() || material.createdAt,
                    },
                });
            } catch (transcriptionError) {
                console.error('Transcription failed:', transcriptionError);

                // Update material with error
                await Material.updateOne(
                    { _id: material._id },
                    {
                        $set: {
                            status: 'failed',
                            processingError: transcriptionError.message || 'Failed to transcribe audio',
                        },
                    }
                );

                return NextResponse.json(
                    { error: 'Failed to transcribe audio. Please try again or use full file mode.' },
                    { status: 500 }
                );
            }
        }

        // Full file upload mode (upload to Gemini)
        try {
            // Convert file to buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Upload to Gemini
            const uploadedFile = await uploadFile({
                file: buffer,
                mimeType,
                displayName: fileName,
            });

            // Wait for processing if it's a video
            let processedFile = uploadedFile;
            if (isVideo) {
                processedFile = await waitForFileProcessing(uploadedFile.name);
            }

            // Determine material type
            let materialType = 'file';
            if (isVideo) materialType = 'video';
            else if (isAudio) materialType = 'audio';
            else if (mimeType === 'application/pdf') materialType = 'pdf';
            else if (mimeType.startsWith('image/')) materialType = 'image';

            // Create material
            const material = await Material.create({
                projectId,
                userId: session.user.id,
                type: materialType,
                name: fileName,
                description: description?.trim(),
                file: {
                    originalName: file.name,
                    mimeType,
                    size: file.size,
                    geminiUri: processedFile.uri,
                    geminiFileName: processedFile.name,
                },
                status: 'ready',
                order,
            });

            // Update project stats
            await Project.updateOne(
                { _id: projectId },
                { $inc: { 'stats.materialCount': 1 } }
            );

            return NextResponse.json({
                data: {
                    id: material._id.toString(),
                    type: material.type,
                    name: material.name,
                    description: material.description,
                    file: {
                        originalName: file.name,
                        mimeType,
                        size: file.size,
                        geminiUri: processedFile.uri,
                        geminiFileName: processedFile.name,
                    },
                    status: material.status,
                    order: material.order,
                    createdAt: material.createdAt?.toISOString?.() || material.createdAt,
                },
            });
        } catch (uploadError) {
            console.error('File upload failed:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file. Please try again.' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Upload API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
