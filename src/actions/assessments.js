'use server';

import { auth } from '@/auth';
import { Project, Material, Assessment, AssessmentAttempt } from '@/models';
import { connectDB } from '@/utils/clients';
import { generateAssessmentQuestions, gradeAnswerWithAI } from '@/utils/ai/generateAssessment';

/**
 * Generate a new assessment for a project
 *
 * @param {Object} data
 * @param {string} data.projectId - Project ID
 * @param {Object} data.settings - Generation settings
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function generateAssessment({ projectId, settings }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        const {
            questionCount = 10,
            questionTypes = ['multiple_choice'],
            difficulty = 'medium',
            focusTopics = [],
            customInstructions = '',
            materialIds = [], // If empty, use all materials
            title: customTitle,
        } = settings;

        await connectDB();

        // Verify project ownership
        const project = await Project.findOne({
            _id: projectId,
            userId: session.user.id,
        });

        if (!project) {
            return { error: 'Project not found' };
        }

        // Get materials
        const materialQuery = { projectId, status: 'ready' };
        if (materialIds.length > 0) {
            materialQuery._id = { $in: materialIds };
        }

        const materials = await Material.find(materialQuery).lean();

        if (materials.length === 0) {
            return { error: 'No ready materials found. Add some materials first.' };
        }

        // Generate questions using AI
        const generated = await generateAssessmentQuestions({
            materials,
            settings: {
                questionCount,
                questionTypes,
                difficulty,
                focusTopics,
                customInstructions,
            },
        });

        // Create the assessment
        const assessment = await Assessment.create({
            projectId,
            userId: session.user.id,
            title: customTitle || generated.title,
            description: generated.description,
            questions: generated.questions,
            settings: {
                questionCount,
                questionTypes,
                difficulty,
                focusTopics,
                customInstructions,
                materialIds: materials.map((m) => m._id),
            },
            status: 'draft',
        });

        // Update project stats
        await Project.updateOne(
            { _id: projectId },
            { $inc: { 'stats.assessmentCount': 1 } }
        );

        return {
            data: {
                id: assessment._id.toString(),
                title: assessment.title,
                description: assessment.description,
                questionCount: assessment.questions.length,
                totalPoints: assessment.totalPoints,
                status: assessment.status,
                createdAt: assessment.createdAt?.toISOString?.() || assessment.createdAt,
            },
        };
    } catch (error) {
        console.error('generateAssessment error:', error);
        return { error: error.message || 'Failed to generate assessment' };
    }
}

/**
 * Get all assessments for a project
 *
 * @param {string} projectId - Project ID
 * @returns {Promise<{data?: Array, error?: string}>}
 */
export async function getAssessments(projectId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
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

        const assessments = await Assessment.find({ projectId })
            .select('-questions') // Don't include full questions in list
            .sort({ createdAt: -1 })
            .lean();

        return {
            data: assessments.map((a) => ({
                id: a._id.toString(),
                title: a.title,
                description: a.description,
                questionCount: a.questions?.length || 0,
                totalPoints: a.totalPoints,
                status: a.status,
                stats: a.stats ? {
                    attemptCount: a.stats.attemptCount || 0,
                    averageScore: a.stats.averageScore || 0,
                    completionRate: a.stats.completionRate || 0,
                } : undefined,
                settings: a.settings ? {
                    questionCount: a.settings.questionCount,
                    questionTypes: a.settings.questionTypes ? [...a.settings.questionTypes] : [],
                    difficulty: a.settings.difficulty,
                    focusTopics: a.settings.focusTopics ? [...a.settings.focusTopics] : [],
                    customInstructions: a.settings.customInstructions,
                    materialIds: a.settings.materialIds ? a.settings.materialIds.map(id => id.toString()) : [],
                } : undefined,
                createdAt: a.createdAt?.toISOString?.() || a.createdAt,
            })),
        };
    } catch (error) {
        console.error('getAssessments error:', error);
        return { error: 'Failed to fetch assessments' };
    }
}

/**
 * Get a single assessment with full questions
 *
 * @param {string} assessmentId - Assessment ID
 * @param {boolean} includeAnswers - Whether to include correct answers
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function getAssessment(assessmentId, includeAnswers = false) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        await connectDB();

        const assessment = await Assessment.findOne({
            _id: assessmentId,
            userId: session.user.id,
        }).lean();

        if (!assessment) {
            return { error: 'Assessment not found' };
        }

        // If not including answers, strip them from questions
        const questions = assessment.questions.map((q) => {
            const question = {
                type: q.type,
                question: q.question,
                options: q.options?.map((o) => ({
                    id: o.id,
                    text: o.text,
                    ...(includeAnswers && { isCorrect: o.isCorrect }),
                })),
                points: q.points,
                difficulty: q.difficulty,
                topic: q.topic,
                hint: q.hint,
            };

            if (includeAnswers) {
                question.correctAnswer = q.correctAnswer;
                question.explanation = q.explanation;
            }

            return question;
        });

        return {
            data: {
                id: assessment._id.toString(),
                projectId: assessment.projectId.toString(),
                title: assessment.title,
                description: assessment.description,
                questions,
                totalPoints: assessment.totalPoints,
                timeLimit: assessment.timeLimit,
                status: assessment.status,
                stats: assessment.stats,
                settings: {
                    ...assessment.settings,
                    materialIds: assessment.settings?.materialIds?.map((id) => id.toString()) || [],
                },
                createdAt: assessment.createdAt?.toISOString?.() || assessment.createdAt,
            },
        };
    } catch (error) {
        console.error('getAssessment error:', error);
        return { error: 'Failed to fetch assessment' };
    }
}

/**
 * Start an assessment attempt
 *
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function startAssessmentAttempt(assessmentId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        await connectDB();

        const assessment = await Assessment.findOne({
            _id: assessmentId,
            userId: session.user.id,
        });

        if (!assessment) {
            return { error: 'Assessment not found' };
        }

        // Check for existing in-progress attempt
        const existingAttempt = await AssessmentAttempt.findOne({
            assessmentId,
            userId: session.user.id,
            status: 'in_progress',
        });

        if (existingAttempt) {
            return {
                data: {
                    id: existingAttempt._id.toString(),
                    status: existingAttempt.status,
                    startedAt: existingAttempt.startedAt?.toISOString?.() || existingAttempt.startedAt,
                    answers: existingAttempt.answers?.map((a) => ({
                        questionIndex: a.questionIndex,
                        answer: a.answer,
                    })) || [],
                },
            };
        }

        // Create new attempt
        const attempt = await AssessmentAttempt.create({
            assessmentId,
            userId: session.user.id,
            projectId: assessment.projectId,
            status: 'in_progress',
            score: {
                total: assessment.totalPoints,
            },
        });

        return {
            data: {
                id: attempt._id.toString(),
                status: attempt.status,
                startedAt: attempt.startedAt?.toISOString?.() || attempt.startedAt,
                answers: [],
            },
        };
    } catch (error) {
        console.error('startAssessmentAttempt error:', error);
        return { error: 'Failed to start assessment' };
    }
}

/**
 * Submit an answer for an assessment attempt
 *
 * @param {Object} data
 * @param {string} data.attemptId - Attempt ID
 * @param {number} data.questionIndex - Question index
 * @param {*} data.answer - User's answer
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
export async function submitAnswer({ attemptId, questionIndex, answer }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        await connectDB();

        const attempt = await AssessmentAttempt.findOne({
            _id: attemptId,
            userId: session.user.id,
            status: 'in_progress',
        });

        if (!attempt) {
            return { error: 'Attempt not found or already submitted' };
        }

        // Update or add the answer
        const existingIndex = attempt.answers.findIndex(
            (a) => a.questionIndex === questionIndex
        );

        if (existingIndex >= 0) {
            attempt.answers[existingIndex].answer = answer;
        } else {
            attempt.answers.push({ questionIndex, answer });
        }

        await attempt.save();

        return { success: true };
    } catch (error) {
        console.error('submitAnswer error:', error);
        return { error: 'Failed to save answer' };
    }
}

/**
 * Submit and grade an assessment attempt
 *
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function submitAssessmentAttempt(attemptId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        await connectDB();

        const attempt = await AssessmentAttempt.findOne({
            _id: attemptId,
            userId: session.user.id,
            status: 'in_progress',
        });

        if (!attempt) {
            return { error: 'Attempt not found or already submitted' };
        }

        const assessment = await Assessment.findById(attempt.assessmentId);
        if (!assessment) {
            return { error: 'Assessment not found' };
        }

        // Grade each answer
        let totalEarned = 0;

        for (const answer of attempt.answers) {
            const question = assessment.questions[answer.questionIndex];
            if (!question) continue;

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
        }

        // Update attempt
        const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

        attempt.status = 'graded';
        attempt.submittedAt = new Date();
        attempt.gradedAt = new Date();
        attempt.timeTaken = timeTaken;
        attempt.score = {
            earned: totalEarned,
            total: assessment.totalPoints,
            percentage: Math.round((totalEarned / assessment.totalPoints) * 100),
        };

        await attempt.save();

        // Update assessment stats
        const allAttempts = await AssessmentAttempt.find({
            assessmentId: assessment._id,
            status: 'graded',
        });

        const avgScore = allAttempts.reduce((sum, a) => sum + a.score.percentage, 0) / allAttempts.length;
        const highestScore = Math.max(...allAttempts.map((a) => a.score.percentage));
        const avgTime = allAttempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / allAttempts.length;

        await Assessment.updateOne(
            { _id: assessment._id },
            {
                $set: {
                    'stats.attemptCount': allAttempts.length,
                    'stats.averageScore': Math.round(avgScore),
                    'stats.highestScore': highestScore,
                    'stats.averageTime': Math.round(avgTime),
                },
            }
        );

        return {
            data: {
                id: attempt._id.toString(),
                status: attempt.status,
                score: {
                    earned: attempt.score.earned,
                    total: attempt.score.total,
                    percentage: attempt.score.percentage,
                },
                timeTaken: attempt.timeTaken,
                answers: attempt.answers.map((a) => ({
                    questionIndex: a.questionIndex,
                    answer: a.answer,
                    isCorrect: a.isCorrect,
                    pointsEarned: a.pointsEarned,
                    aiFeedback: a.aiFeedback,
                })),
            },
        };
    } catch (error) {
        console.error('submitAssessmentAttempt error:', error);
        return { error: 'Failed to submit assessment' };
    }
}

/**
 * Get assessment attempt results
 *
 * @param {string} attemptId - Attempt ID
 * @returns {Promise<{data?: Object, error?: string}>}
 */
export async function getAttemptResults(attemptId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        await connectDB();

        const attempt = await AssessmentAttempt.findOne({
            _id: attemptId,
            userId: session.user.id,
        }).lean();

        if (!attempt) {
            return { error: 'Attempt not found' };
        }

        const assessment = await Assessment.findById(attempt.assessmentId).lean();
        if (!assessment) {
            return { error: 'Assessment not found' };
        }

        // Combine questions with answers and include correct answers
        const results = assessment.questions.map((q, index) => {
            const answer = attempt.answers.find((a) => a.questionIndex === index);
            return {
                question: q.question,
                type: q.type,
                options: q.options?.map((o) => ({
                    id: o.id,
                    text: o.text,
                    isCorrect: o.isCorrect,
                })),
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                points: q.points,
                userAnswer: answer?.answer,
                isCorrect: answer?.isCorrect || false,
                pointsEarned: answer?.pointsEarned || 0,
                aiFeedback: answer?.aiFeedback,
            };
        });

        return {
            data: {
                id: attempt._id.toString(),
                assessmentId: assessment._id.toString(),
                title: assessment.title,
                status: attempt.status,
                score: {
                    earned: attempt.score?.earned || 0,
                    total: attempt.score?.total || 0,
                    percentage: attempt.score?.percentage || 0,
                },
                timeTaken: attempt.timeTaken,
                startedAt: attempt.startedAt?.toISOString?.() || attempt.startedAt,
                submittedAt: attempt.submittedAt?.toISOString?.() || attempt.submittedAt,
                results,
            },
        };
    } catch (error) {
        console.error('getAttemptResults error:', error);
        return { error: 'Failed to fetch results' };
    }
}

/**
 * Delete an assessment
 *
 * @param {string} assessmentId - Assessment ID
 * @returns {Promise<{success?: boolean, error?: string}>}
 */
export async function deleteAssessment(assessmentId) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { error: 'Unauthorized: Please sign in' };
        }

        await connectDB();

        const assessment = await Assessment.findOne({
            _id: assessmentId,
            userId: session.user.id,
        });

        if (!assessment) {
            return { error: 'Assessment not found' };
        }

        // Delete all attempts
        await AssessmentAttempt.deleteMany({ assessmentId });

        // Delete the assessment
        await Assessment.deleteOne({ _id: assessmentId });

        // Update project stats
        await Project.updateOne(
            { _id: assessment.projectId },
            { $inc: { 'stats.assessmentCount': -1 } }
        );

        return { success: true };
    } catch (error) {
        console.error('deleteAssessment error:', error);
        return { error: 'Failed to delete assessment' };
    }
}
