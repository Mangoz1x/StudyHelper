'use client';

import { useState, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Question } from '@/components/assessments/Question';
import { Button } from '@/components/ui';
import { CheckCircle2, XCircle, Lightbulb, HelpCircle, SkipForward, BookOpen, Quote } from 'lucide-react';
import { useStudyMode } from '../StudyModeContext';

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

    const handleMouseUp = useCallback(() => {
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
        } else {
            setShowReferenceButton(false);
            setSelectedText('');
        }
    }, []);

    const handleReference = useCallback(() => {
        if (selectedText) {
            setReference(selectedText, artifact.id, artifact.title);
            setShowReferenceButton(false);
            setSelectedText('');
            window.getSelection()?.removeAllRanges();
        }
    }, [selectedText, artifact.id, artifact.title, setReference]);

    // Hide button when clicking elsewhere
    const handleMouseDown = useCallback((e) => {
        if (e.target.closest('.reference-button')) return;
        setShowReferenceButton(false);
    }, []);

    return (
        <div
            ref={containerRef}
            className="p-6 relative"
            onMouseUp={handleMouseUp}
            onMouseDown={handleMouseDown}
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
                <ReactMarkdown
                    components={{
                        p: ({ children }) => <p className="mb-4 last:mb-0 text-gray-700 leading-relaxed">{children}</p>,
                        h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-3 mt-6 first:mt-0">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold text-gray-900 mb-2 mt-5 first:mt-0">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-bold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-700">{children}</ol>,
                        li: ({ children }) => <li className="ml-2">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ inline, children }) =>
                            inline ? (
                                <code className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                            ) : (
                                <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg text-sm font-mono overflow-x-auto my-3">{children}</code>
                            ),
                        pre: ({ children }) => <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-sm overflow-x-auto my-3">{children}</pre>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-violet-300 pl-4 italic my-4 text-gray-600">{children}</blockquote>,
                        a: ({ href, children }) => <a href={href} className="text-violet-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                        hr: () => <hr className="my-6 border-gray-200" />,
                    }}
                >
                    {section.content || ''}
                </ReactMarkdown>
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
        fill_blank: 'Fill in the Blank',
    };

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
