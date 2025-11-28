import { auth } from '@/auth';
import { Artifact } from '@/models';
import { connectDB } from '@/utils/clients';

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

        // Grade the answer (same logic as inline questions)
        const { correctAnswer, type } = section.question;
        let isCorrect = false;

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
                if (typeof answer === 'string' && typeof correctAnswer === 'string') {
                    isCorrect =
                        answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                } else if (typeof answer === 'string' && Array.isArray(correctAnswer)) {
                    isCorrect = correctAnswer.some(
                        (ca) => answer.trim().toLowerCase() === ca.trim().toLowerCase()
                    );
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

        // Update the question with the answer
        await Artifact.updateOne(
            { _id: artifactId },
            {
                $set: {
                    [`content.sections.${sectionIndex}.question.userAnswer`]: answer,
                    [`content.sections.${sectionIndex}.question.answeredAt`]: new Date(),
                    [`content.sections.${sectionIndex}.question.isCorrect`]: isCorrect,
                },
            }
        );

        return Response.json({
            data: {
                isCorrect,
                correctAnswer,
                explanation: section.question.explanation,
            },
        });
    } catch (error) {
        console.error('[Artifact Answer] POST error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
