'use client';

import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Question Component - Renders different question types
 *
 * Extracted from AssessmentClient for reuse in study mode inline questions.
 *
 * @param {Object} props
 * @param {Object} props.question - The question object
 * @param {number} props.index - Question index (for display number)
 * @param {*} props.answer - Current answer value
 * @param {Function} props.onAnswer - Callback when answer changes
 * @param {boolean} props.disabled - Whether the question is disabled
 * @param {boolean} props.hideNumber - Hide the question number
 * @param {boolean} props.hidePoints - Hide the points display
 * @param {boolean} props.hideHint - Hide the hint display
 * @param {boolean} props.compact - Use compact styling
 */
export function Question({
    question,
    index = 0,
    answer,
    onAnswer,
    disabled = false,
    hideNumber = false,
    hidePoints = false,
    hideHint = false,
    compact = false,
}) {
    const renderQuestion = () => {
        switch (question.type) {
            case 'multiple_choice':
            case 'true_false':
                // Validate options exist
                if (!question.options || question.options.length < 2) {
                    return (
                        <div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                            <div className="flex items-center gap-2 text-amber-700">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">
                                    This question has incomplete options and cannot be answered.
                                </span>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
                        {question.options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onAnswer?.(option.id)}
                                disabled={disabled}
                                className={`
                                    w-full ${compact ? 'p-3' : 'p-4'} rounded-lg border-2 text-left transition-all
                                    ${
                                        answer === option.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }
                                    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                        ${
                                            answer === option.id
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300'
                                        }
                                    `}
                                    >
                                        {answer === option.id && (
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <span className="text-gray-900">{option.text}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                );

            case 'multiple_select':
                // Validate options exist
                if (!question.options || question.options.length < 2) {
                    return (
                        <div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
                            <div className="flex items-center gap-2 text-amber-700">
                                <AlertCircle className="w-5 h-5" />
                                <span className="text-sm">
                                    This question has incomplete options and cannot be answered.
                                </span>
                            </div>
                        </div>
                    );
                }

                const selectedAnswers = Array.isArray(answer) ? answer : [];
                return (
                    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
                        <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
                        {question.options.map((option) => {
                            const isSelected = selectedAnswers.includes(option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            onAnswer?.(selectedAnswers.filter((a) => a !== option.id));
                                        } else {
                                            onAnswer?.([...selectedAnswers, option.id]);
                                        }
                                    }}
                                    disabled={disabled}
                                    className={`
                                        w-full ${compact ? 'p-3' : 'p-4'} rounded-lg border-2 text-left transition-all
                                        ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }
                                        ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`
                                            w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0
                                            ${
                                                isSelected
                                                    ? 'border-blue-500 bg-blue-500'
                                                    : 'border-gray-300'
                                            }
                                        `}
                                        >
                                            {isSelected && (
                                                <CheckCircle2 className="w-4 h-4 text-white" />
                                            )}
                                        </div>
                                        <span className="text-gray-900">{option.text}</span>
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
                        onChange={(e) => onAnswer?.(e.target.value)}
                        disabled={disabled}
                        placeholder="Type your answer..."
                        className={`w-full ${compact ? 'p-3' : 'p-4'} rounded-lg border border-gray-300
                                 bg-white text-gray-900
                                 placeholder:text-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                );

            case 'long_answer':
                return (
                    <textarea
                        value={answer || ''}
                        onChange={(e) => onAnswer?.(e.target.value)}
                        disabled={disabled}
                        rows={compact ? 4 : 6}
                        placeholder="Write your detailed answer..."
                        className={`w-full ${compact ? 'p-3' : 'p-4'} rounded-lg border border-gray-300
                                 bg-white text-gray-900
                                 placeholder:text-gray-400
                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                 disabled:opacity-60 disabled:cursor-not-allowed resize-none`}
                    />
                );

            case 'fill_blank':
                const blanks = (question.question?.match(/___/g) || []).length;
                const fillAnswers = Array.isArray(answer) ? answer : Array(blanks).fill('');
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                            Fill in {blanks} blank{blanks !== 1 ? 's' : ''}
                        </p>
                        {Array(blanks)
                            .fill(0)
                            .map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 w-8">{i + 1}.</span>
                                    <input
                                        type="text"
                                        value={fillAnswers[i] || ''}
                                        onChange={(e) => {
                                            const newAnswers = [...fillAnswers];
                                            newAnswers[i] = e.target.value;
                                            onAnswer?.(newAnswers);
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
                    <p className="text-gray-500">Unknown question type: {question.type}</p>
                );
        }
    };

    return (
        <div className={compact ? 'space-y-3' : 'space-y-4'}>
            <div className="flex items-start gap-4">
                {!hideNumber && (
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                        {index + 1}
                    </span>
                )}
                <div className="flex-1">
                    <p className={`${compact ? 'text-base' : 'text-lg'} text-gray-900 font-medium`}>
                        {question.question}
                    </p>
                    {!hideHint && question.hint && (
                        <p className="mt-2 text-sm text-gray-500 italic">Hint: {question.hint}</p>
                    )}
                </div>
                {!hidePoints && question.points !== undefined && (
                    <span className="flex-shrink-0 text-sm text-gray-500">
                        {question.points} pt{question.points !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <div className={hideNumber ? '' : 'ml-12'}>{renderQuestion()}</div>
        </div>
    );
}
