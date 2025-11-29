'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Question } from '@/components/assessments/Question';
import { Button } from '@/components/ui';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle, SkipForward, BookOpen, Quote } from 'lucide-react';
import { useStudyMode } from '../StudyModeContext';
import { MarkdownContent } from '../MarkdownContent';

/**
 * Lesson Artifact
 *
 * Renders a lesson with mixed content and question sections.
 */
export function LessonArtifact({ artifact }) {
    const { setReference } = useStudyMode();
    const sections = artifact.content?.sections || [];
    const containerRef = useRef(null);
    const [showReferenceButton, setShowReferenceButton] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState('');

    // Use a small delay to allow the selection to complete before checking
    const handleMouseUp = useCallback(() => {
        // Small delay to ensure selection is finalized
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();

            if (text && text.length > 0 && text.length <= 500) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const containerRect = containerRef.current?.getBoundingClientRect();

                if (containerRect) {
                    setButtonPosition({
                        top: rect.top - containerRect.top - 40,
                        left: rect.left - containerRect.left + rect.width / 2,
                    });
                    setSelectedText(text);
                    setShowReferenceButton(true);
                }
            }
        }, 10);
    }, []);

    const handleReference = useCallback(() => {
        if (selectedText) {
            setReference(selectedText, artifact.id, artifact.title);
            setShowReferenceButton(false);
            setSelectedText('');
            window.getSelection()?.removeAllRanges();
        }
    }, [selectedText, artifact.id, artifact.title, setReference]);

    // Hide button only when clicking outside the selection area
    // Don't interfere with the selection process itself
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Don't hide if clicking the reference button
            if (e.target.closest('.reference-button')) return;

            // Check if there's an active selection
            const selection = window.getSelection();
            const text = selection?.toString().trim();

            // Only hide if there's no selection (user clicked to deselect)
            if (!text) {
                setShowReferenceButton(false);
                setSelectedText('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            ref={containerRef}
            className="p-6 relative select-text"
            onMouseUp={handleMouseUp}
        >
            {/* Reference selection button */}
            {showReferenceButton && (
                <button
                    className="reference-button absolute z-50 flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg shadow-lg hover:bg-violet-700 transition-colors transform -translate-x-1/2"
                    style={{ top: buttonPosition.top, left: buttonPosition.left }}
                    onClick={handleReference}
                >
                    <Quote className="w-3 h-3" />
                    Reference
                </button>
            )}

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-violet-600 mb-2">
                    <BookOpen className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-wide">Lesson</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{artifact.title}</h2>
                {artifact.description && (
                    <p className="text-gray-600 mt-1">{artifact.description}</p>
                )}
            </div>

            {/* Sections */}
            <div className="space-y-6">
                {sections.length === 0 ? (
                    <p className="text-gray-500 italic">No content yet.</p>
                ) : (
                    sections.map((section, index) => (
                        <LessonSection
                            key={section.id}
                            section={section}
                            sectionIndex={index}
                            artifactId={artifact.id}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

/**
 * Lesson Section
 *
 * Renders either a content section (markdown) or a question section.
 */
function LessonSection({ section, sectionIndex, artifactId }) {
    if (section.type === 'content') {
        return (
            <div className="prose prose-violet max-w-none">
                <MarkdownContent content={section.content || ''} variant="default" />
            </div>
        );
    }

    if (section.type === 'question' && section.question) {
        return (
            <EmbeddedQuestion
                question={section.question}
                sectionId={section.id}
                artifactId={artifactId}
            />
        );
    }

    return null;
}

/**
 * Embedded Question
 *
 * Interactive question within a lesson artifact.
 */
function EmbeddedQuestion({ question, sectionId, artifactId }) {
    const { updateArtifact, artifacts } = useStudyMode();

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
            const res = await fetch(`/api/study/artifacts/${artifactId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionId, answer: selectedAnswer }),
            });

            const data = await res.json();

            if (data.error) {
                console.error('Answer error:', data.error);
                return;
            }

            setResult(data.data);
            setSubmitted(true);

            // Update artifact in context to reflect the answer
            const currentArtifact = artifacts.find((a) => a.id === artifactId);
            if (currentArtifact) {
                const updatedSections = currentArtifact.content.sections.map((s) =>
                    s.id === sectionId
                        ? {
                              ...s,
                              question: {
                                  ...s.question,
                                  userAnswer: selectedAnswer,
                                  isCorrect: data.data.isCorrect,
                              },
                          }
                        : s
                );
                updateArtifact(artifactId, {
                    content: { ...currentArtifact.content, sections: updatedSections },
                });
            }
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
    };

    const questionTypeLabel = {
        multiple_choice: 'Multiple Choice',
        multiple_select: 'Select All',
        true_false: 'True / False',
        short_answer: 'Short Answer',
        long_answer: 'Long Answer',
        fill_blank: 'Fill in the Blank',
    };

    // Check if this is an AI-graded question type
    const isAIGraded = question.type === 'short_answer' || question.type === 'long_answer';

    return (
        <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">Practice Question</span>
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

            {/* Hint toggle */}
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

            {/* Action buttons */}
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
                                <span className="font-medium text-green-700">
                                    {result.score !== undefined ? `Great! Score: ${result.score}/100` : 'Correct!'}
                                </span>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-5 h-5 text-amber-600" />
                                <span className="font-medium text-amber-700">
                                    {result.score !== undefined ? `Score: ${result.score}/100` : 'Not quite'}
                                </span>
                            </>
                        )}
                    </div>

                    {/* AI Feedback for short/long answers */}
                    {result.feedback && (
                        <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-700">{result.feedback}</p>

                            {/* Key points hit */}
                            {result.keyPointsHit && result.keyPointsHit.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-medium text-green-700 mb-1">What you got right:</p>
                                    <ul className="text-xs text-green-600 space-y-0.5">
                                        {result.keyPointsHit.map((point, i) => (
                                            <li key={i} className="flex items-start gap-1">
                                                <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Key points missed */}
                            {result.keyPointsMissed && result.keyPointsMissed.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs font-medium text-amber-700 mb-1">Areas to improve:</p>
                                    <ul className="text-xs text-amber-600 space-y-0.5">
                                        {result.keyPointsMissed.map((point, i) => (
                                            <li key={i} className="flex items-start gap-1">
                                                <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                <span>{point}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Standard explanation (for non-AI graded) */}
                    {!result.feedback && result.explanation && (
                        <p className="text-sm text-gray-700 mt-1">{result.explanation}</p>
                    )}

                    {/* Model answer for AI-graded questions */}
                    {isAIGraded && !result.skipped && result.correctAnswer && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-600 mb-1">Model answer:</p>
                            <p className="text-sm text-gray-700">
                                {Array.isArray(result.correctAnswer)
                                    ? result.correctAnswer.join(' OR ')
                                    : result.correctAnswer}
                            </p>
                        </div>
                    )}

                    {/* Correct answer for non-AI graded questions */}
                    {!isAIGraded && !result.isCorrect && !result.skipped && result.correctAnswer && (
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
