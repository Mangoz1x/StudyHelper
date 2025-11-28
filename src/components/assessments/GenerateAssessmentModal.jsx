'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Modal, ModalBody, ModalFooter, Button, Input } from '@/components/ui';
import {
    Sparkles,
    CheckCircle2,
    ListChecks,
    ToggleLeft,
    MessageSquare,
    FileText,
    Grid,
    ChevronDown,
    ChevronUp,
    Loader2,
    Brain,
    Zap,
    HelpCircle,
    Video,
} from 'lucide-react';

const QUESTION_TYPES = [
    { id: 'multiple_choice', label: 'Multiple Choice', icon: CheckCircle2, description: 'One correct answer from options' },
    { id: 'multiple_select', label: 'Multiple Select', icon: ListChecks, description: 'Multiple correct answers' },
    { id: 'true_false', label: 'True/False', icon: ToggleLeft, description: 'True or false statements' },
    { id: 'short_answer', label: 'Short Answer', icon: MessageSquare, description: '1-3 sentence responses' },
    { id: 'long_answer', label: 'Long Answer', icon: FileText, description: 'Extended essay responses' },
    { id: 'fill_blank', label: 'Fill in the Blank', icon: Grid, description: 'Complete the sentence' },
];

const DIFFICULTY_OPTIONS = [
    { id: 'easy', label: 'Easy', description: 'Basic recall and understanding' },
    { id: 'medium', label: 'Medium', description: 'Application and connection' },
    { id: 'hard', label: 'Hard', description: 'Analysis and critical thinking' },
    { id: 'mixed', label: 'Mixed', description: '30% easy, 50% medium, 20% hard' },
];

const QUESTION_TYPE_ICONS = {
    multiple_choice: CheckCircle2,
    multiple_select: ListChecks,
    true_false: ToggleLeft,
    short_answer: MessageSquare,
    long_answer: FileText,
    fill_blank: Grid,
};

const QUESTION_TYPE_LABELS = {
    multiple_choice: 'Multiple Choice',
    multiple_select: 'Multiple Select',
    true_false: 'True/False',
    short_answer: 'Short Answer',
    long_answer: 'Long Answer',
    fill_blank: 'Fill in the Blank',
};

/**
 * Parse questions from streaming JSON content
 * Uses incremental parsing to extract complete question objects as they stream in
 */
function parseQuestionsFromStream(content) {
    if (!content) return [];

    const questions = [];

    try {
        // First try: parse the entire content as valid JSON
        try {
            const parsed = JSON.parse(content);
            if (parsed.questions && Array.isArray(parsed.questions)) {
                return parsed.questions.map(q => ({
                    type: q.type || 'multiple_choice',
                    question: q.question || q.question_text || '',
                    options: q.options || [],
                    difficulty: q.difficulty || 'medium',
                }));
            }
            if (Array.isArray(parsed)) {
                return parsed.map(q => ({
                    type: q.type || 'multiple_choice',
                    question: q.question || q.question_text || '',
                    options: q.options || [],
                    difficulty: q.difficulty || 'medium',
                }));
            }
        } catch {
            // Not complete JSON yet, try incremental parsing
        }

        // Second try: find complete question objects by counting braces
        const findCompleteObjects = (str, startKey) => {
            const results = [];
            const keyPattern = new RegExp(`"${startKey}"\\s*:\\s*\\[`, 'g');
            let match = keyPattern.exec(str);

            if (!match) {
                if (str.trim().startsWith('[')) {
                    match = { index: str.indexOf('[') };
                } else {
                    return results;
                }
            }

            let start = match.index + (match[0]?.length || 1);
            let depth = 1;
            let objStart = -1;

            for (let i = start; i < str.length && depth > 0; i++) {
                const char = str[i];

                if (char === '{') {
                    if (objStart === -1) objStart = i;
                    depth++;
                } else if (char === '}') {
                    depth--;
                    if (depth === 1 && objStart !== -1) {
                        const objStr = str.slice(objStart, i + 1);
                        try {
                            const obj = JSON.parse(objStr);
                            if (obj.question || obj.question_text) {
                                results.push(obj);
                            }
                        } catch {
                            // Incomplete object, skip
                        }
                        objStart = -1;
                    }
                } else if (char === '[') {
                    depth++;
                } else if (char === ']') {
                    depth--;
                }
            }

            return results;
        };

        let foundQuestions = findCompleteObjects(content, 'questions');

        if (foundQuestions.length === 0 && content.trim().startsWith('[')) {
            foundQuestions = findCompleteObjects(content, '');
        }

        for (const q of foundQuestions) {
            questions.push({
                type: q.type || 'multiple_choice',
                question: q.question || q.question_text || '',
                options: q.options || [],
                difficulty: q.difficulty || 'medium',
            });
        }
    } catch {
        // Parsing failed, return empty array
    }

    return questions;
}

/**
 * Generate Assessment Modal with Streaming Preview
 */
export function GenerateAssessmentModal({ open, onClose, projectId, materials, onAssessmentGenerated }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Streaming state
    const [streaming, setStreaming] = useState(false);
    const [thinkingContent, setThinkingContent] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [stage, setStage] = useState(''); // 'thinking', 'generating', 'complete'
    const [analyzingMetadata, setAnalyzingMetadata] = useState(null); // What's being analyzed
    const [thinkingExpanded, setThinkingExpanded] = useState(false); // Whether thinking panel is expanded

    const abortControllerRef = useRef(null);
    const thinkingScrollRef = useRef(null);

    // Auto-scroll thinking content when expanded and new content arrives
    useEffect(() => {
        if (thinkingExpanded && thinkingScrollRef.current && thinkingContent) {
            thinkingScrollRef.current.scrollTop = thinkingScrollRef.current.scrollHeight;
        }
    }, [thinkingContent, thinkingExpanded]);

    // Parse questions from streamed content for preview
    const parsedQuestions = useMemo(() => {
        return parseQuestionsFromStream(generatedContent);
    }, [generatedContent]);

    // Form state
    const [title, setTitle] = useState('');
    const [numQuestions, setNumQuestions] = useState(10);
    const [selectedTypes, setSelectedTypes] = useState(['multiple_choice']);
    const [difficulty, setDifficulty] = useState('medium');
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [focusTopics, setFocusTopics] = useState('');
    const [customInstructions, setCustomInstructions] = useState('');

    const resetForm = () => {
        setTitle('');
        setNumQuestions(10);
        setSelectedTypes(['multiple_choice']);
        setDifficulty('medium');
        setSelectedMaterials([]);
        setFocusTopics('');
        setCustomInstructions('');
        setShowAdvanced(false);
        setError('');
        setThinkingContent('');
        setGeneratedContent('');
        setStage('');
        setAnalyzingMetadata(null);
        setThinkingExpanded(false);
    };

    const handleClose = () => {
        if (loading || streaming) {
            // Abort ongoing request
            abortControllerRef.current?.abort();
        }
        resetForm();
        onClose();
    };

    const toggleQuestionType = (typeId) => {
        setSelectedTypes((prev) => {
            if (prev.includes(typeId)) {
                if (prev.length === 1) return prev;
                return prev.filter((t) => t !== typeId);
            }
            return [...prev, typeId];
        });
    };

    const toggleMaterial = (materialId) => {
        setSelectedMaterials((prev) => {
            if (prev.includes(materialId)) {
                return prev.filter((m) => m !== materialId);
            }
            return [...prev, materialId];
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setThinkingContent('');
        setGeneratedContent('');
        setStage('thinking');
        setStreaming(true);
        setLoading(true);

        const readyMaterials = materials.filter((m) => m.status === 'ready');
        if (readyMaterials.length === 0) {
            setError('No processed materials available. Add some materials first.');
            setLoading(false);
            setStreaming(false);
            return;
        }

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('/api/assessments/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    settings: {
                        title: title || undefined,
                        questionCount: numQuestions,
                        questionTypes: selectedTypes,
                        difficulty,
                        materialIds: selectedMaterials.length > 0 ? selectedMaterials : [],
                        focusTopics: focusTopics ? focusTopics.split(',').map((t) => t.trim()).filter(Boolean) : [],
                        customInstructions,
                    },
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate assessment');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let result = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });
                const lines = text.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === 'metadata') {
                                // Set metadata about what's being analyzed
                                setAnalyzingMetadata(data.analyzing);
                            } else if (data.type === 'thinking') {
                                setStage('thinking');
                                setThinkingContent((prev) => prev + data.content);
                            } else if (data.type === 'content') {
                                setStage('generating');
                                setGeneratedContent((prev) => prev + data.content);
                            } else if (data.type === 'complete') {
                                setStage('complete');
                                result = data.data;
                            } else if (data.type === 'error') {
                                // Don't throw, set error state instead
                                setError(data.error || 'An error occurred during generation');
                                setStage('error');
                                setLoading(false);
                                setStreaming(false);
                                return;
                            }
                        } catch (parseError) {
                            // Skip malformed JSON but log it
                            console.log('Parse error for line:', line, parseError);
                        }
                    }
                }
            }

            if (result) {
                resetForm();
                onClose();
                onAssessmentGenerated?.(result);
            } else if (!error) {
                // Stream ended without result or error
                setError('Generation completed but no assessment was created. Please try again.');
                setStage('error');
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                // User cancelled
                setStreaming(false);
                setLoading(false);
            } else {
                console.error('Generation error:', err);
                setError(err.message || 'Failed to generate assessment');
                setStage('error');
            }
        } finally {
            setLoading(false);
            setStreaming(false);
        }
    };

    const readyMaterials = materials.filter((m) => m.status === 'ready');

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={streaming ? 'Generating Assessment...' : 'Generate Assessment'}
            size="xl"
        >
            {streaming || stage === 'error' ? (
                // Streaming view
                <div className="p-6 space-y-4">
                    {/* Progress indicator */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            stage === 'thinking'
                                ? 'bg-violet-100 text-violet-700'
                                : stage === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            <Brain className="w-4 h-4" />
                            Thinking
                        </div>
                        <div className="h-px flex-1 bg-gray-200" />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            stage === 'generating'
                                ? 'bg-blue-100 text-blue-700'
                                : stage === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            <Zap className="w-4 h-4" />
                            Generating
                        </div>
                        <div className="h-px flex-1 bg-gray-200" />
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                            stage === 'complete'
                                ? 'bg-green-100 text-green-700'
                                : stage === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-500'
                        }`}>
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                        </div>
                    </div>

                    {/* Error display */}
                    {error && (
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-red-700">
                                    Error
                                </span>
                            </div>
                            <p className="text-sm text-red-600">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Analyzing status - engaging loader before thinking starts */}
                    {stage === 'thinking' && !thinkingContent && (
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-6 border border-violet-200">
                            <div className="flex flex-col items-center text-center space-y-4">
                                {/* Animated icon */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-violet-200 rounded-full animate-ping opacity-75"></div>
                                    <div className="relative bg-white rounded-full p-3 shadow-lg">
                                        {analyzingMetadata?.hasVideos ? (
                                            <Video className="w-8 h-8 text-violet-600 animate-pulse" />
                                        ) : analyzingMetadata?.hasFiles ? (
                                            <FileText className="w-8 h-8 text-violet-600 animate-pulse" />
                                        ) : (
                                            <Brain className="w-8 h-8 text-violet-600 animate-pulse" />
                                        )}
                                    </div>
                                </div>

                                {/* Main message */}
                                <div>
                                    <p className="text-base font-semibold text-violet-700 mb-1">
                                        {analyzingMetadata?.hasVideos ? 'Analyzing video content...' :
                                         analyzingMetadata?.hasFiles ? 'Processing uploaded files...' :
                                         'Analyzing materials...'}
                                    </p>
                                    <p className="text-sm text-violet-600">
                                        {analyzingMetadata?.hasVideos ? 'This may take a minute while the AI processes the video' :
                                         analyzingMetadata?.hasFiles ? 'Processing your files and extracting key information' :
                                         'Reading through your materials to understand the content'}
                                    </p>
                                </div>

                                {/* Material count badge - only show if we have metadata */}
                                {analyzingMetadata && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                                        <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-medium text-violet-700">
                                            Processing {analyzingMetadata.materialCount} material{analyzingMetadata.materialCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                )}

                                {/* Progress dots */}
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Thinking preview - collapsible */}
                    {thinkingContent && (
                        <div className="bg-violet-50 rounded-lg border border-violet-200">
                            <button
                                type="button"
                                onClick={() => setThinkingExpanded(!thinkingExpanded)}
                                className="w-full flex items-center gap-2 p-4 hover:bg-violet-100 transition-colors"
                            >
                                <Brain className="w-4 h-4 text-violet-600" />
                                <span className="text-sm font-medium text-violet-700">
                                    AI Thinking Process
                                </span>
                                {stage === 'thinking' && (
                                    <Loader2 className="w-4 h-4 text-violet-600 animate-spin ml-2" />
                                )}
                                {thinkingExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-violet-600 ml-auto" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-violet-600 ml-auto" />
                                )}
                            </button>
                            {thinkingExpanded && (
                                <div
                                    ref={thinkingScrollRef}
                                    className="px-4 pb-4 max-h-64 overflow-y-auto text-sm text-violet-600 whitespace-pre-wrap font-mono border-t border-violet-200"
                                >
                                    {thinkingContent}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Generated questions preview */}
                    {(generatedContent || parsedQuestions.length > 0) && (
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">
                                    Questions Preview
                                </span>
                                <span className="text-xs text-gray-500">
                                    {parsedQuestions.length} / {numQuestions}
                                </span>
                                {stage === 'generating' && (
                                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin ml-auto" />
                                )}
                            </div>

                            {/* Visual question cards */}
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {parsedQuestions.map((q, index) => {
                                    const IconComponent = QUESTION_TYPE_ICONS[q.type] || HelpCircle;
                                    return (
                                        <div
                                            key={index}
                                            className="bg-white rounded-lg p-3 border border-gray-200 animate-fadeIn"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-blue-600">
                                                        {index + 1}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <IconComponent className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="text-xs text-gray-500">
                                                            {QUESTION_TYPE_LABELS[q.type] || q.type}
                                                        </span>
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                            q.difficulty === 'easy'
                                                                ? 'bg-green-100 text-green-700'
                                                                : q.difficulty === 'hard'
                                                                    ? 'bg-red-100 text-red-700'
                                                                    : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {q.difficulty}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-900 line-clamp-2">
                                                        {q.question}
                                                    </p>
                                                    {q.options && q.options.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {q.options.slice(0, 4).map((opt, optIndex) => (
                                                                <span
                                                                    key={optIndex}
                                                                    className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                                                                >
                                                                    {String.fromCharCode(65 + optIndex)}. {typeof opt === 'string' ? opt.slice(0, 30) : opt.text?.slice(0, 30)}
                                                                    {(typeof opt === 'string' ? opt : opt.text)?.length > 30 && '...'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Loading placeholder for next question */}
                                {stage === 'generating' && parsedQuestions.length < numQuestions && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200 border-dashed">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        {stage === 'error' && (
                            <Button onClick={() => {
                                setError('');
                                setStage('');
                                setThinkingContent('');
                                setGeneratedContent('');
                            }}>
                                Try Again
                            </Button>
                        )}
                        <Button variant="secondary" onClick={handleClose}>
                            {stage === 'error' ? 'Close' : 'Cancel'}
                        </Button>
                    </div>
                </div>
            ) : (
                // Configuration form
                <form onSubmit={handleSubmit}>
                    <ModalBody className="space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Title */}
                        <Input
                            label="Assessment Title (optional)"
                            placeholder="Leave empty for AI-generated title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        {/* Question Count */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Questions
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    step="5"
                                    value={numQuestions}
                                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="w-12 text-center font-semibold text-gray-900">
                                    {numQuestions}
                                </span>
                            </div>
                        </div>

                        {/* Question Types */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Question Types
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {QUESTION_TYPES.map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => toggleQuestionType(type.id)}
                                        className={`
                                            p-3 rounded-lg border-2 text-left transition-all
                                            ${selectedTypes.includes(type.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <type.icon className={`w-4 h-4 ${selectedTypes.includes(type.id) ? 'text-blue-600' : 'text-gray-500'}`} />
                                            <span className={`text-sm font-medium ${selectedTypes.includes(type.id) ? 'text-blue-600' : 'text-gray-700'}`}>
                                                {type.label}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {type.description}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difficulty
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {DIFFICULTY_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setDifficulty(option.id)}
                                        className={`
                                            p-3 rounded-lg border-2 text-center transition-all
                                            ${difficulty === option.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <span className={`text-sm font-medium ${difficulty === option.id ? 'text-blue-600' : 'text-gray-700'}`}>
                                            {option.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Advanced Options Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Advanced Options
                        </button>

                        {/* Advanced Options */}
                        {showAdvanced && (
                            <div className="space-y-4 pt-2 border-t border-gray-200">
                                {/* Material Selection */}
                                {readyMaterials.length > 1 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select Materials (optional - uses all if none selected)
                                        </label>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {readyMaterials.map((material) => (
                                                <label
                                                    key={material.id}
                                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMaterials.includes(material.id)}
                                                        onChange={() => toggleMaterial(material.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">
                                                        {material.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Focus Topics */}
                                <Input
                                    label="Focus Topics (comma-separated)"
                                    placeholder="e.g., photosynthesis, cell division, genetics"
                                    value={focusTopics}
                                    onChange={(e) => setFocusTopics(e.target.value)}
                                />

                                {/* Custom Instructions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Custom Instructions
                                    </label>
                                    <textarea
                                        value={customInstructions}
                                        onChange={(e) => setCustomInstructions(e.target.value)}
                                        placeholder="Any specific instructions for the AI..."
                                        rows={3}
                                        className="block w-full rounded-lg border border-gray-300
                                                 bg-white px-4 py-2.5 text-gray-900
                                                 placeholder:text-gray-400
                                                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                                 transition-colors duration-150 resize-none text-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Warning for no materials */}
                        {readyMaterials.length === 0 && (
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="text-sm text-amber-600">
                                    No processed materials found. Add some materials to your project first.
                                </p>
                            </div>
                        )}
                    </ModalBody>

                    <ModalFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={loading}
                            disabled={readyMaterials.length === 0}
                            leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        >
                            {loading ? 'Generating...' : 'Generate Assessment'}
                        </Button>
                    </ModalFooter>
                </form>
            )}
        </Modal>
    );
}
