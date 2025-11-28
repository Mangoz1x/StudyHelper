'use client';

import { useState } from 'react';
import { Question } from '@/components/assessments/Question';
import { Button } from '@/components/ui';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle, SkipForward } from 'lucide-react';

/**
 * Inline Question Component
 *
 * Displays an interactive quiz question within a chat message.
 * Uses the shared Question component for rendering different question types.
 *
 * @param {Object} props
 * @param {Object} props.question - The question object from inlineQuestion
 * @param {string} props.messageId - The message ID (for API call)
 * @param {Function} props.onAnswer - Callback when question is answered
 */
export function InlineQuestion({ question, messageId, onAnswer }) {
    const [selectedAnswer, setSelectedAnswer] = useState(
        question.userAnswer !== undefined ? question.userAnswer : null
    );
    const [submitted, setSubmitted] = useState(question.userAnswer !== undefined);
    const [result, setResult] = useState(
        question.userAnswer !== undefined
            ? {
                  isCorrect: question.isCorrect,
                  explanation: question.explanation,
                  correctAnswer: question.correctAnswer,
              }
            : null
    );
    const [showHint, setShowHint] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (selectedAnswer === null || selectedAnswer === undefined || loading) return;

        setLoading(true);

        try {
            const res = await fetch(`/api/study/messages/${messageId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: selectedAnswer }),
            });

            const data = await res.json();

            if (data.error) {
                console.error('Answer error:', data.error);
                return;
            }

            setResult(data.data);
            setSubmitted(true);
            onAnswer?.(data.data);
        } catch (error) {
            console.error('Failed to submit answer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        setSubmitted(true);
        setResult({
            isCorrect: false,
            explanation: question.explanation,
            correctAnswer: question.correctAnswer,
            skipped: true,
        });
        onAnswer?.({ skipped: true });
    };

    const questionTypeLabel = {
        multiple_choice: 'Multiple Choice',
        multiple_select: 'Select All',
        true_false: 'True / False',
        short_answer: 'Short Answer',
        fill_blank: 'Fill in the Blank',
    };

    return (
        <div className="bg-violet-50 rounded-xl p-4 my-3 border border-violet-200">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">Quick Check</span>
                <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-600 rounded-full">
                    {questionTypeLabel[question.type] || question.type}
                </span>
            </div>

            {/* Question using shared component */}
            <Question
                question={question}
                index={0}
                answer={selectedAnswer}
                onAnswer={setSelectedAnswer}
                disabled={submitted}
                hideNumber
                hidePoints
                hideHint
                compact
            />

            {/* Hint toggle (before answering) */}
            {!submitted && question.hint && (
                <button
                    onClick={() => setShowHint(!showHint)}
                    className="mt-3 text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                    <Lightbulb className="w-4 h-4" />
                    {showHint ? 'Hide hint' : 'Show hint'}
                </button>
            )}
            {showHint && !submitted && (
                <p className="mt-2 text-sm text-violet-600 bg-violet-100 p-2 rounded-lg">
                    {question.hint}
                </p>
            )}

            {/* Action buttons (before answering) */}
            {!submitted && (
                <div className="flex items-center gap-2 mt-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedAnswer === null || selectedAnswer === undefined}
                        loading={loading}
                        size="sm"
                    >
                        Check Answer
                    </Button>
                    <Button
                        onClick={handleSkip}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <SkipForward className="w-4 h-4 mr-1" />
                        Skip
                    </Button>
                </div>
            )}

            {/* Result feedback */}
            {result && (
                <div
                    className={`mt-4 p-3 rounded-lg ${
                        result.skipped
                            ? 'bg-gray-100'
                            : result.isCorrect
                              ? 'bg-green-100'
                              : 'bg-amber-100'
                    }`}
                >
                    <div className="flex items-center gap-2 mb-1">
                        {result.skipped ? (
                            <>
                                <SkipForward className="w-5 h-5 text-gray-500" />
                                <span className="font-medium text-gray-700">Skipped</span>
                            </>
                        ) : result.isCorrect ? (
                            <>
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-green-700">Correct!</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-5 h-5 text-amber-600" />
                                <span className="font-medium text-amber-700">Not quite</span>
                            </>
                        )}
                    </div>
                    {result.explanation && (
                        <p className="text-sm text-gray-700 mt-1">{result.explanation}</p>
                    )}
                    {!result.isCorrect && !result.skipped && result.correctAnswer && (
                        <p className="text-sm text-gray-600 mt-2">
                            <span className="font-medium">Correct answer:</span>{' '}
                            {Array.isArray(result.correctAnswer)
                                ? result.correctAnswer.join(', ')
                                : result.correctAnswer}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
