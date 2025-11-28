import { auth } from '@/auth';
import { StudyMessage } from '@/models';
import { connectDB } from '@/utils/clients';

/**
 * POST /api/study/messages/[messageId]/answer
 * Submit an answer to an inline question
 */
export async function POST(request, { params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { messageId } = await params;
        const { answer } = await request.json();

        if (answer === undefined) {
            return Response.json({ error: 'Answer is required' }, { status: 400 });
        }

        await connectDB();

        // Fetch the message
        const message = await StudyMessage.findOne({
            _id: messageId,
            userId: session.user.id,
        });

        if (!message) {
            return Response.json({ error: 'Message not found' }, { status: 404 });
        }

        if (!message.inlineQuestion) {
            return Response.json({ error: 'No question in this message' }, { status: 400 });
        }

        if (message.inlineQuestion.userAnswer !== undefined) {
            return Response.json({ error: 'Question already answered' }, { status: 400 });
        }

        // Grade the answer
        const { correctAnswer, type } = message.inlineQuestion;
        let isCorrect = false;

        switch (type) {
            case 'multiple_choice':
            case 'true_false':
                // Simple string comparison
                isCorrect = answer === correctAnswer;
                break;

            case 'multiple_select':
                // Compare arrays (order doesn't matter)
                if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
                    const sortedAnswer = [...answer].sort();
                    const sortedCorrect = [...correctAnswer].sort();
                    isCorrect =
                        sortedAnswer.length === sortedCorrect.length &&
                        sortedAnswer.every((v, i) => v === sortedCorrect[i]);
                }
                break;

            case 'short_answer':
                // Case-insensitive comparison, trimmed
                if (typeof answer === 'string' && typeof correctAnswer === 'string') {
                    isCorrect =
                        answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
                } else if (typeof answer === 'string' && Array.isArray(correctAnswer)) {
                    // Multiple acceptable answers
                    isCorrect = correctAnswer.some(
                        (ca) => answer.trim().toLowerCase() === ca.trim().toLowerCase()
                    );
                }
                break;

            case 'fill_blank':
                // Compare each blank (case-insensitive)
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

        // Update the message with the answer
        await StudyMessage.updateOne(
            { _id: messageId },
            {
                $set: {
                    'inlineQuestion.userAnswer': answer,
                    'inlineQuestion.answeredAt': new Date(),
                    'inlineQuestion.isCorrect': isCorrect,
                },
            }
        );

        return Response.json({
            data: {
                isCorrect,
                correctAnswer,
                explanation: message.inlineQuestion.explanation,
            },
        });
    } catch (error) {
        console.error('[Study Answer] POST error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
