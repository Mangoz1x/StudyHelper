'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent } from '@/components/ui';
import { submitAnswer, submitAssessmentAttempt } from '@/actions';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    Send,
    Loader2,
    Target,
    AlertCircle,
} from 'lucide-react';

/**
 * Question Component - Renders different question types
 */
function Question({ question, index, answer, onAnswer, disabled }) {
    const renderQuestion = () => {
        switch (question.type) {
            case 'multiple_choice':
            case 'true_false':
                return (
                    <div className="space-y-2">
                        {question.options?.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onAnswer(option.id)}
                                disabled={disabled}
                                className={`
                                    w-full p-4 rounded-lg border-2 text-left transition-all
                                    ${answer === option.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }
                                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                                        ${answer === option.id
                                            ? 'border-blue-500 bg-blue-500'
                                            : 'border-gray-300'
                                        }
                                    `}>
                                        {answer === option.id && (
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <span className="text-gray-900">
                                        {option.text}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 'multiple_select':
                const selectedAnswers = Array.isArray(answer) ? answer : [];
                return (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-500 mb-3">
                            Select all that apply
                        </p>
                        {question.options?.map((option) => {
                            const isSelected = selectedAnswers.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            onAnswer(selectedAnswers.filter((a) => a !== option.id));
                                        } else {
                                            onAnswer([...selectedAnswers, option.id]);
                                        }
                                    }}
                                    disabled={disabled}
                                    className={`
                                        w-full p-4 rounded-lg border-2 text-left transition-all
                                        ${isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }
                                        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-6 h-6 rounded border-2 flex items-center justify-center
                                            ${isSelected
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                            }
                                        `}>
                                            {isSelected && (
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <span className="text-gray-900">
                                            {option.text}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );

            case 'short_answer':
                return (
                    <input
                        type="text"
                        value={answer || ''}
                        onChange={(e) => onAnswer(e.target.value)}
                        disabled={disabled}
                        placeholder="Type your answer..."
                        className="w-full p-4 rounded-lg border border-gray-300
                                 bg-white text-gray-900
                                 placeholder:text-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                );

            case 'long_answer':
                return (
                    <textarea
                        value={answer || ''}
                        onChange={(e) => onAnswer(e.target.value)}
                        disabled={disabled}
                        rows={6}
                        placeholder="Write your detailed answer..."
                        className="w-full p-4 rounded-lg border border-gray-300
                                 bg-white text-gray-900
                                 placeholder:text-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                    />
                );

            case 'fill_blank':
                const blanks = (question.question.match(/___/g) || []).length;
                const fillAnswers = Array.isArray(answer) ? answer : Array(blanks).fill('');
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                            Fill in {blanks} blank{blanks !== 1 ? 's' : ''}
                        </p>
                        {Array(blanks).fill(0).map((_, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-8">
                                    {i + 1}.
                                </span>
                                <input
                                    type="text"
                                    value={fillAnswers[i] || ''}
                                    onChange={(e) => {
                                        const newAnswers = [...fillAnswers];
                                        newAnswers[i] = e.target.value;
                                        onAnswer(newAnswers);
                                    }}
                                    disabled={disabled}
                                    placeholder={`Blank ${i + 1}`}
                                    className="flex-1 p-3 rounded-lg border border-gray-300
                                             bg-white text-gray-900
                                             placeholder:text-gray-400
                                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                             disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        ))}
                    </div>
                );

            default:
                return (
                    <p className="text-gray-500">
                        Unknown question type: {question.type}
                    </p>
                );
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                    {index + 1}
                </span>
                <div className="flex-1">
                    <p className="text-lg text-gray-900 font-medium">
                        {question.question}
                    </p>
                    {question.hint && (
                        <p className="mt-2 text-sm text-gray-500 italic">
                            Hint: {question.hint}
                        </p>
                    )}
                </div>
                <span className="flex-shrink-0 text-sm text-gray-500">
                    {question.points} pt{question.points !== 1 ? 's' : ''}
                </span>
            </div>
            <div className="ml-12">
                {renderQuestion()}
            </div>
        </div>
    );
}

/**
 * Assessment Client Component
 */
export function AssessmentClient({ assessment, attempt, projectId, error }) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState(() => {
        // Initialize answers from existing attempt
        const initial = {};
        if (attempt?.answers) {
            attempt.answers.forEach((a) => {
                initial[a.questionIndex] = a.answer;
            });
        }
        return initial;
    });
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    if (error) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Link href={`/dashboard/projects/${projectId}`}>
                    <Button variant="secondary" className="mt-4">
                        Back to Project
                    </Button>
                </Link>
            </div>
        );
    }

    if (!assessment || !attempt) {
        return null;
    }

    const questions = assessment.questions || [];
    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;

    const handleAnswer = useCallback(async (answer) => {
        setAnswers((prev) => ({ ...prev, [currentIndex]: answer }));

        // Auto-save answer
        setSaving(true);
        await submitAnswer({
            attemptId: attempt.id,
            questionIndex: currentIndex,
            answer,
        });
        setSaving(false);
    }, [attempt?.id, currentIndex]);

    const handleSubmit = async () => {
        if (!confirm('Are you sure you want to submit your assessment? You cannot change your answers after submission.')) {
            return;
        }

        // Mark attempt as submitted (not graded yet)
        setSubmitting(true);

        // Redirect to grading screen immediately
        router.push(`/dashboard/projects/${projectId}/assessments/${assessment.id}/results/${attempt.id}?grading=true`);
    };

    const goToPrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const goToNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link
                    href={`/dashboard/projects/${projectId}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Project
                </Link>
                {saving && (
                    <span className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                    </span>
                )}
            </div>

            {/* Assessment Info */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {assessment.title}
                </h1>
                {assessment.description && (
                    <p className="mt-2 text-gray-600">
                        {assessment.description}
                    </p>
                )}
            </div>

            {/* Progress Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                            Question {currentIndex + 1} of {totalQuestions}
                        </span>
                        <span className="text-sm text-gray-600">
                            {answeredCount} answered
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                        />
                    </div>
                    {/* Question dots */}
                    <div className="flex flex-wrap gap-1 mt-3">
                        {questions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`
                                    w-8 h-8 rounded-lg text-xs font-medium transition-all
                                    ${i === currentIndex
                                        ? 'bg-blue-500 text-white'
                                        : answers[i] !== undefined
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }
                                `}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Question Card */}
            <Card>
                <CardContent className="p-6">
                    {currentQuestion && (
                        <Question
                            question={currentQuestion}
                            index={currentIndex}
                            answer={answers[currentIndex]}
                            onAnswer={handleAnswer}
                            disabled={submitting}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="secondary"
                    onClick={goToPrevious}
                    disabled={currentIndex === 0 || submitting}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                    Previous
                </Button>

                <div className="flex items-center gap-3">
                    {currentIndex === totalQuestions - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            loading={submitting}
                            leftIcon={<Send className="w-4 h-4" />}
                        >
                            Submit Assessment
                        </Button>
                    ) : (
                        <Button
                            onClick={goToNext}
                            disabled={submitting}
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            Next
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {assessment.totalPoints} total points
                </span>
                {assessment.timeLimit > 0 && (
                    <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {assessment.timeLimit} min time limit
                    </span>
                )}
            </div>
        </div>
    );
}
