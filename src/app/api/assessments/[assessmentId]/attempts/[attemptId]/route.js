export const dynamic = 'force-dynamic';

import { auth } from '@/auth';
import { Assessment, AssessmentAttempt } from '@/models';
import { connectDB } from '@/utils/clients';
import { gradeAnswerWithAI } from '@/utils/ai/generateAssessment';

/**
 * POST /api/assessments/[assessmentId]/attempts/[attemptId]
 * Grade an assessment attempt with real-time progress via SSE
 */
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { assessmentId, attemptId } = await params;
        await connectDB();

        // Fetch attempt and verify ownership
        const attempt = await AssessmentAttempt.findOne({
            _id: attemptId,
            userId: session.user.id,
            assessmentId,
            status: 'in_progress',
        });

        if (!attempt) {
            return Response.json({ error: 'Attempt not found or already graded' }, { status: 404 });
        }

        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return Response.json({ error: 'Assessment not found' }, { status: 404 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const sendSSE = (type, data) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
                };

                try {
                    let totalEarned = 0;
                    const totalQuestions = attempt.answers.length;

                    // Send initial progress
                    sendSSE('progress', { current: 0, total: totalQuestions });

                    // Grade each answer
                    for (let i = 0; i < attempt.answers.length; i++) {
                        const answer = attempt.answers[i];
                        const question = assessment.questions[answer.questionIndex];

                        if (!question) {
                            sendSSE('progress', { current: i + 1, total: totalQuestions });
                            continue;
                        }

                        sendSSE('grading', {
                            questionIndex: answer.questionIndex,
                            questionText: question.question
                        });

                        let isCorrect = false;
                        let pointsEarned = 0;

                        switch (question.type) {
                            case 'multiple_choice':
                            case 'true_false':
                                isCorrect = answer.answer === question.correctAnswer;
                                pointsEarned = isCorrect ? question.points : 0;
                                break;

                            case 'multiple_select':
                                const correctSet = new Set(question.correctAnswer);
                                const answerSet = new Set(answer.answer || []);
                                isCorrect = correctSet.size === answerSet.size &&
                                    [...correctSet].every((v) => answerSet.has(v));
                                pointsEarned = isCorrect ? question.points : 0;
                                break;

                            case 'fill_blank':
                                const correctAnswers = question.correctAnswer.map((a) => a.toLowerCase().trim());
                                const userAnswers = (answer.answer || []).map((a) => a.toLowerCase().trim());
                                const correctCount = correctAnswers.filter((ca, i) => userAnswers[i] === ca).length;
                                pointsEarned = (correctCount / correctAnswers.length) * question.points;
                                isCorrect = pointsEarned === question.points;
                                break;

                            case 'short_answer':
                            case 'long_answer':
                                // Use AI grading for text answers
                                const grading = await gradeAnswerWithAI({
                                    question: question.question,
                                    expectedAnswer: question.correctAnswer,
                                    userAnswer: answer.answer || '',
                                    maxPoints: question.points,
                                });
                                pointsEarned = grading.pointsEarned;
                                isCorrect = grading.isCorrect;
                                answer.aiFeedback = grading.feedback;
                                answer.aiConfidence = grading.confidence;
                                break;
                        }

                        answer.isCorrect = isCorrect;
                        answer.pointsEarned = pointsEarned;
                        totalEarned += pointsEarned;

                        sendSSE('graded', {
                            questionIndex: answer.questionIndex,
                            isCorrect,
                            pointsEarned
                        });
                        sendSSE('progress', { current: i + 1, total: totalQuestions });
                    }

                    // Calculate final score
                    const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);
                    const percentage = Math.round((totalEarned / assessment.totalPoints) * 100);

                    attempt.status = 'graded';
                    attempt.submittedAt = new Date();
                    attempt.gradedAt = new Date();
                    attempt.timeTaken = timeTaken;
                    attempt.score = {
                        earned: totalEarned,
                        total: assessment.totalPoints,
                        percentage,
                    };

                    await attempt.save();

                    // Update assessment stats
                    const allAttempts = await AssessmentAttempt.find({
                        assessmentId: assessment._id,
                        status: 'graded',
                    });

                    const avgScore = Math.round(
                        allAttempts.reduce((sum, a) => sum + a.score.percentage, 0) / allAttempts.length
                    );
                    const highestScore = Math.max(...allAttempts.map((a) => a.score.percentage));

                    assessment.stats = {
                        attemptCount: allAttempts.length,
                        averageScore: avgScore,
                        highestScore,
                    };

                    await assessment.save();

                    // Send completion
                    sendSSE('complete', {
                        attemptId: attempt._id.toString(),
                        score: attempt.score,
                    });

                } catch (error) {
                    console.error('[Grading] Error:', error);
                    sendSSE('error', { error: error.message || 'Grading failed' });
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
        console.error('[Grading] Request error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
