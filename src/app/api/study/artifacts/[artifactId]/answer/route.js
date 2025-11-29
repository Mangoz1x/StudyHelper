import { auth } from '@/auth';
import { Artifact } from '@/models';
import { connectDB } from '@/utils/clients';
import { gradeAnswer } from '@/utils/ai/gradeAnswer';

/**
 * POST /api/study/artifacts/[artifactId]/answer
 *
 * Submit an answer to an embedded question in a lesson artifact
 *
 * Body:
 * - sectionId: string - The section ID containing the question
 * - answer: mixed - The user's answer
 */
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { artifactId } = await params;
        const { sectionId, answer } = await request.json();

        if (!sectionId || answer === undefined) {
            return Response.json({ error: 'sectionId and answer are required' }, { status: 400 });
        }

        await connectDB();

        // Fetch the artifact
        const artifact = await Artifact.findOne({
            _id: artifactId,
            userId: session.user.id,
        });

        if (!artifact) {
            return Response.json({ error: 'Artifact not found' }, { status: 404 });
        }

        if (artifact.type !== 'lesson') {
            return Response.json(
                { error: 'Only lesson artifacts have questions' },
                { status: 400 }
            );
        }

        // Find the section
        const sectionIndex = artifact.content.sections.findIndex((s) => s.id === sectionId);
        if (sectionIndex === -1) {
            return Response.json({ error: 'Section not found' }, { status: 404 });
        }

        const section = artifact.content.sections[sectionIndex];
        if (section.type !== 'question' || !section.question) {
            return Response.json({ error: 'Section is not a question' }, { status: 400 });
        }

        if (section.question.userAnswer !== undefined) {
            return Response.json({ error: 'Question already answered' }, { status: 400 });
        }

        // Grade the answer based on question type
        const { correctAnswer, type, question: questionText, explanation } = section.question;
        let isCorrect = false;
        let score = null;
        let feedback = null;
        let keyPointsHit = null;
        let keyPointsMissed = null;

        switch (type) {
            case 'multiple_choice':
            case 'true_false':
                isCorrect = answer === correctAnswer;
                break;

            case 'multiple_select':
                if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
                    const sortedAnswer = [...answer].sort();
                    const sortedCorrect = [...correctAnswer].sort();
                    isCorrect =
                        sortedAnswer.length === sortedCorrect.length &&
                        sortedAnswer.every((v, i) => v === sortedCorrect[i]);
                }
                break;

            case 'short_answer':
            case 'long_answer':
                // Use AI grading for short and long answer questions
                if (typeof answer === 'string' && answer.trim().length > 0) {
                    const gradingResult = await gradeAnswer({
                        question: questionText,
                        studentAnswer: answer,
                        correctAnswer: typeof correctAnswer === 'string'
                            ? correctAnswer
                            : Array.isArray(correctAnswer)
                                ? correctAnswer.join(' OR ')
                                : String(correctAnswer),
                        questionType: type,
                    });

                    isCorrect = gradingResult.isCorrect;
                    score = gradingResult.score;
                    feedback = gradingResult.feedback;
                    keyPointsHit = gradingResult.keyPointsHit;
                    keyPointsMissed = gradingResult.keyPointsMissed;
                }
                break;

            case 'fill_blank':
                if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
                    if (answer.length === correctAnswer.length) {
                        isCorrect = answer.every(
                            (a, i) =>
                                a.trim().toLowerCase() === correctAnswer[i].trim().toLowerCase()
                        );
                    }
                }
                break;
        }

        // Build update data
        const updateData = {
            [`content.sections.${sectionIndex}.question.userAnswer`]: answer,
            [`content.sections.${sectionIndex}.question.answeredAt`]: new Date(),
            [`content.sections.${sectionIndex}.question.isCorrect`]: isCorrect,
        };

        // Add AI grading data if available
        if (score !== null) {
            updateData[`content.sections.${sectionIndex}.question.score`] = score;
        }
        if (feedback !== null) {
            updateData[`content.sections.${sectionIndex}.question.aiFeedback`] = feedback;
        }
        if (keyPointsHit !== null) {
            updateData[`content.sections.${sectionIndex}.question.keyPointsHit`] = keyPointsHit;
        }
        if (keyPointsMissed !== null) {
            updateData[`content.sections.${sectionIndex}.question.keyPointsMissed`] = keyPointsMissed;
        }

        // Update the question with the answer
        await Artifact.updateOne(
            { _id: artifactId },
            { $set: updateData }
        );

        // Build response
        const responseData = {
            isCorrect,
            correctAnswer,
            explanation,
        };

        // Include AI grading details for short/long answers
        if (score !== null) {
            responseData.score = score;
            responseData.feedback = feedback;
            responseData.keyPointsHit = keyPointsHit;
            responseData.keyPointsMissed = keyPointsMissed;
        }

        return Response.json({ data: responseData });
    } catch (error) {
        console.error('[Artifact Answer] POST error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
