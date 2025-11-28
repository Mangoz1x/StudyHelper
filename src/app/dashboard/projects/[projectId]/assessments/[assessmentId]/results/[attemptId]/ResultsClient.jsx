'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import {
    ArrowLeft,
    Trophy,
    CheckCircle2,
    XCircle,
    Clock,
    Target,
    RotateCcw,
    AlertCircle,
    MessageSquare,
    Loader2,
    Brain,
} from 'lucide-react';

/**
 * Result Question Component
 */
function ResultQuestion({ result, index }) {
    const isCorrect = result.isCorrect;
    const hasPartialCredit = result.pointsEarned > 0 && result.pointsEarned < result.points;

    const renderAnswer = () => {
        switch (result.type) {
            case 'multiple_choice':
            case 'true_false':
                return (
                    <div className="space-y-2">
                        {result.options?.map((option) => {
                            const isUserAnswer = result.userAnswer === option.id;
                            const isCorrectOption = option.id === result.correctAnswer;

                            return (
                                <div
                                    key={option.id}
                                    className={`
                                        p-3 rounded-lg border-2 flex items-center gap-3
                                        ${isCorrectOption
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : isUserAnswer
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }
                                    `}
                                >
                                    {isCorrectOption ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : isUserAnswer ? (
                                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                                    )}
                                    <span className={`
                                        ${isCorrectOption ? 'text-green-700 dark:text-green-300 font-medium' : ''}
                                        ${isUserAnswer && !isCorrectOption ? 'text-red-700 dark:text-red-300' : ''}
                                        ${!isCorrectOption && !isUserAnswer ? 'text-gray-600 dark:text-gray-400' : ''}
                                    `}>
                                        {option.text}
                                    </span>
                                    {isUserAnswer && (
                                        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                                            Your answer
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );

            case 'multiple_select':
                const userAnswers = Array.isArray(result.userAnswer) ? result.userAnswer : [];
                const correctAnswers = Array.isArray(result.correctAnswer) ? result.correctAnswer : [];

                return (
                    <div className="space-y-2">
                        {result.options?.map((option) => {
                            const isUserAnswer = userAnswers.includes(option.id);
                            const isCorrectOption = correctAnswers.includes(option.id);

                            return (
                                <div
                                    key={option.id}
                                    className={`
                                        p-3 rounded-lg border-2 flex items-center gap-3
                                        ${isCorrectOption
                                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                            : isUserAnswer
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                                : 'border-gray-200 dark:border-gray-700'
                                        }
                                    `}
                                >
                                    {isCorrectOption ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    ) : isUserAnswer ? (
                                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    ) : (
                                        <div className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                                    )}
                                    <span className={`
                                        ${isCorrectOption ? 'text-green-700 dark:text-green-300 font-medium' : ''}
                                        ${isUserAnswer && !isCorrectOption ? 'text-red-700 dark:text-red-300' : ''}
                                    `}>
                                        {option.text}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'short_answer':
            case 'long_answer':
                return (
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Your Answer:
                            </p>
                            <div className={`p-3 rounded-lg border ${isCorrect ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                                    {result.userAnswer || <em className="text-gray-400">No answer provided</em>}
                                </p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Expected Answer:
                            </p>
                            <div className="p-3 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20">
                                <p className="text-green-700 dark:text-green-300 whitespace-pre-wrap">
                                    {result.correctAnswer}
                                </p>
                            </div>
                        </div>
                        {result.aiFeedback && (
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                                            AI Feedback
                                        </p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">
                                            {result.aiFeedback}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'fill_blank':
                const userFillAnswers = Array.isArray(result.userAnswer) ? result.userAnswer : [];
                const correctFillAnswers = Array.isArray(result.correctAnswer) ? result.correctAnswer : [];

                return (
                    <div className="space-y-2">
                        {correctFillAnswers.map((correct, i) => {
                            const userAnswer = userFillAnswers[i] || '';
                            const isBlankCorrect = userAnswer.toLowerCase().trim() === correct.toLowerCase().trim();

                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 w-8">
                                        {i + 1}.
                                    </span>
                                    <div className={`flex-1 p-2 rounded-lg ${isBlankCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                        <span className={isBlankCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                                            {userAnswer || <em>blank</em>}
                                        </span>
                                    </div>
                                    {!isBlankCorrect && (
                                        <>
                                            <span className="text-gray-400">→</span>
                                            <div className="flex-1 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                                                <span className="text-green-700 dark:text-green-300 font-medium">
                                                    {correct}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Card className={`border-l-4 ${isCorrect ? 'border-l-green-500' : hasPartialCredit ? 'border-l-amber-500' : 'border-l-red-500'}`}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                        <span className={`
                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                            ${isCorrect
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : hasPartialCredit
                                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }
                        `}>
                            {index + 1}
                        </span>
                        <div>
                            <p className="text-gray-900 dark:text-white font-medium">
                                {result.question}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : hasPartialCredit ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.pointsEarned}/{result.points} pts
                        </span>
                    </div>
                </div>

                {renderAnswer()}

                {result.explanation && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Explanation
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {result.explanation}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Grading Screen Component - Shows while assessment is being graded
 */
function GradingScreen({ projectId, assessmentId, attemptId }) {
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    useEffect(() => {
        // Use fetch with ReadableStream instead of EventSource (which doesn't support POST)
        const startGrading = async () => {
            try {
                const response = await fetch(`/api/assessments/${assessmentId}/attempts/${attemptId}`, {
                    method: 'POST',
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const text = decoder.decode(value, { stream: true });
                    const lines = text.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                switch (data.type) {
                                    case 'progress':
                                        setProgress({ current: data.current, total: data.total });
                                        break;
                                    case 'grading':
                                        setCurrentQuestion(data.questionText);
                                        break;
                                    case 'complete':
                                        // Grading complete - remove query param and reload
                                        router.replace(`/dashboard/projects/${projectId}/assessments/${assessmentId}/results/${attemptId}`);
                                        router.refresh();
                                        return;
                                    case 'error':
                                        setError(data.error);
                                        return;
                                }
                            } catch (e) {
                                console.error('[Grading] Parse error:', e);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('[Grading] Fetch error:', error);
                setError(error.message || 'Failed to start grading. Please try again.');
            }
        };

        startGrading();
    }, [assessmentId, attemptId, projectId, router]);

    const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl">
                <CardContent className="p-12">
                    {error ? (
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Grading Error</h2>
                            <p className="text-gray-600 mb-6">{error}</p>
                            <Button onClick={() => router.refresh()}>
                                Try Again
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center space-y-8">
                            {/* Animated icon */}
                            <div className="relative inline-block">
                                <div className="absolute inset-0 bg-violet-200 rounded-full animate-ping opacity-75"></div>
                                <div className="relative bg-gradient-to-br from-violet-500 to-purple-600 rounded-full p-6 shadow-lg">
                                    <Brain className="w-12 h-12 text-white animate-pulse" />
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    Grading Your Assessment
                                </h2>
                                <p className="text-gray-600">
                                    Please wait while we evaluate your answers...
                                </p>
                            </div>

                            {/* Progress */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                                    <span>Progress</span>
                                    <span>{progress.current} / {progress.total} questions</span>
                                </div>
                                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500 ease-out"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <div className="text-4xl font-bold text-violet-600">
                                    {percentage}%
                                </div>
                            </div>

                            {/* Current question */}
                            {currentQuestion && (
                                <div className="bg-violet-50 rounded-lg p-4 text-left">
                                    <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-2">
                                        Currently grading
                                    </p>
                                    <p className="text-sm text-gray-700 line-clamp-2">
                                        {currentQuestion}
                                    </p>
                                </div>
                            )}

                            {/* Loading dots */}
                            <div className="flex justify-center gap-2">
                                <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Results Client Component
 */
export function ResultsClient({ results, projectId, assessmentId, attemptId, error }) {
    const searchParams = useSearchParams();
    const isGrading = searchParams.get('grading') === 'true';

    // Show grading screen if ?grading=true is in URL
    if (isGrading) {
        return <GradingScreen projectId={projectId} assessmentId={assessmentId} attemptId={attemptId} />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">{error}</p>
                <Link href={`/dashboard/projects/${projectId}`}>
                    <Button variant="secondary" className="mt-4">
                        Back to Project
                    </Button>
                </Link>
            </div>
        );
    }

    if (!results) {
        return null;
    }

    const { score, timeTaken, title, results: questionResults } = results;
    const correctCount = questionResults.filter((r) => r.isCorrect).length;
    const totalQuestions = questionResults.length;

    const formatTime = (seconds) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-blue-600';
        if (percentage >= 50) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBg = (percentage) => {
        if (percentage >= 90) return 'bg-gradient-to-br from-green-50 to-emerald-100';
        if (percentage >= 70) return 'bg-gradient-to-br from-blue-50 to-indigo-100';
        if (percentage >= 50) return 'bg-gradient-to-br from-amber-50 to-orange-100';
        return 'bg-gradient-to-br from-red-50 to-rose-100';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Link
                href={`/dashboard/projects/${projectId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Project
            </Link>

            {/* Score Card - Redesigned */}
            <Card className="overflow-hidden shadow-lg">
                <div className={`p-10 ${getScoreBg(score?.percentage || 0)}`}>
                    <div className="text-center">
                        <div className="relative inline-block mb-4">
                            <div className={`absolute inset-0 ${getScoreColor(score?.percentage || 0)} opacity-20 rounded-full blur-xl`}></div>
                            <Trophy className={`relative w-16 h-16 mx-auto ${getScoreColor(score?.percentage || 0)}`} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-3">
                            {title}
                        </h1>
                        <div className={`text-7xl font-black ${getScoreColor(score?.percentage || 0)} mb-3`}>
                            {score?.percentage || 0}%
                        </div>
                        <p className="text-lg text-gray-700 font-medium">
                            {score?.earned || 0} / {score?.total || 0} points
                        </p>
                    </div>
                </div>
                <CardContent className="p-8 bg-white">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{correctCount}</div>
                            <p className="text-sm font-medium text-gray-500">Correct</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-red-600 mb-2">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{totalQuestions - correctCount}</div>
                            <p className="text-sm font-medium text-gray-500">Incorrect</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 mb-1">{formatTime(timeTaken)}</div>
                            <p className="text-sm font-medium text-gray-500">Time Taken</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
                <Link href={`/dashboard/projects/${projectId}/assessments/${results.assessmentId}`}>
                    <Button leftIcon={<RotateCcw className="w-4 h-4" />}>
                        Retake Assessment
                    </Button>
                </Link>
                <Link href={`/dashboard/projects/${projectId}`}>
                    <Button variant="secondary">
                        Back to Project
                    </Button>
                </Link>
            </div>

            {/* Question Results */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Question Review
                </h2>
                <div className="space-y-4">
                    {questionResults.map((result, index) => (
                        <ResultQuestion
                            key={index}
                            result={result}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
