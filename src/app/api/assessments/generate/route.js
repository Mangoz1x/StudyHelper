export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { Project, Material, Assessment } from '@/models';
import { connectDB } from '@/utils/clients';
import { generateAssessmentQuestions } from '@/utils/ai/generateAssessment';

/** Helper to send SSE message */
function sendSSE(controller, encoder, type, data) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
}

/**
 * POST /api/assessments/generate
 * Streams assessment generation
 */
export async function POST(request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { projectId, settings } = await request.json();
        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({ _id: projectId, userId: session.user.id });
        if (!project) {
            return Response.json({ error: 'Project not found' }, { status: 404 });
        }

        // Get materials
        const materialQuery = { projectId, status: 'ready' };
        if (settings.materialIds?.length) {
            materialQuery._id = { $in: settings.materialIds };
        }
        const materials = await Material.find(materialQuery).lean();

        if (!materials.length) {
            return Response.json({ error: 'No ready materials found' }, { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Use the utility function to generate assessment with streaming
                    const generated = await generateAssessmentQuestions({
                        materials,
                        settings,
                        onProgress: (progress) => {
                            sendSSE(controller, encoder, progress.type, { content: progress.content });
                        },
                    });

                    // Save assessment
                    const assessment = await Assessment.create({
                        projectId,
                        userId: session.user.id,
                        title: settings.title || generated.title,
                        description: generated.description,
                        questions: generated.questions,
                        totalPoints: generated.questions.reduce((sum, q) => sum + (q.points || 1), 0),
                        settings: {
                            questionCount: settings.questionCount,
                            questionTypes: settings.questionTypes,
                            difficulty: settings.difficulty,
                            focusTopics: settings.focusTopics || [],
                            customInstructions: settings.customInstructions || '',
                            materialIds: materials.map(m => m._id),
                        },
                        status: 'draft',
                    });

                    await Project.updateOne({ _id: projectId }, { $inc: { 'stats.assessmentCount': 1 } });

                    sendSSE(controller, encoder, 'complete', {
                        data: {
                            id: assessment._id.toString(),
                            title: assessment.title,
                            description: assessment.description,
                            questionCount: generated.questions.length,
                            totalPoints: assessment.totalPoints,
                            status: assessment.status,
                        },
                    });
                } catch (error) {
                    console.error('[Assessment] Error:', error);
                    sendSSE(controller, encoder, 'error', { error: error.message || 'Generation failed' });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('[Assessment] Request error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
