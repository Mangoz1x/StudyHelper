'use client';

import { useState, useCallback, useRef } from 'react';
import { Layers, RotateCcw, ChevronLeft, ChevronRight, Check, Shuffle, BookOpen, Quote } from 'lucide-react';
import { Button } from '@/components/ui';
import { useStudyMode } from '../StudyModeContext';

/**
 * Flashcards Artifact
 *
 * Renders a flashcard set with study mode.
 */
export function FlashcardsArtifact({ artifact }) {
    const cards = artifact.content?.cards || [];
    const [mode, setMode] = useState('browse'); // 'browse' | 'study'
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [studyOrder, setStudyOrder] = useState([...Array(cards.length).keys()]);

    // Calculate progress for study mode
    const studiedCount = cards.filter((c) => c.studied).length;
    const progressPercent = cards.length > 0 ? Math.round((studiedCount / cards.length) * 100) : 0;

    const handleShuffle = () => {
        const shuffled = [...studyOrder].sort(() => Math.random() - 0.5);
        setStudyOrder(shuffled);
        setCurrentIndex(0);
        setFlipped(false);
    };

    const handleNext = () => {
        if (currentIndex < cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setFlipped(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setFlipped(false);
        }
    };

    const handleStartStudy = () => {
        setMode('study');
        setCurrentIndex(0);
        setFlipped(false);
        // Optionally shuffle at start
        handleShuffle();
    };

    const handleEndStudy = () => {
        setMode('browse');
        setCurrentIndex(0);
        setFlipped(false);
    };

    const currentCard = mode === 'study'
        ? cards[studyOrder[currentIndex]]
        : cards[currentIndex];

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-violet-600 mb-2">
                    <Layers className="w-5 h-5" />
                    <span className="text-sm font-medium uppercase tracking-wide">Flashcards</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{artifact.title}</h2>
                {artifact.description && (
                    <p className="text-gray-600 mt-1">{artifact.description}</p>
                )}

                {/* Stats */}
                <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                        <strong className="text-gray-900">{cards.length}</strong> cards
                    </span>
                    <span className="text-gray-600">
                        <strong className="text-gray-900">{studiedCount}</strong> studied
                    </span>
                </div>
            </div>

            {cards.length === 0 ? (
                <p className="text-gray-500 italic">No flashcards yet.</p>
            ) : mode === 'browse' ? (
                // Browse mode - show all cards in grid
                <BrowseMode
                    cards={cards}
                    artifactId={artifact.id}
                    artifactTitle={artifact.title}
                    onStartStudy={handleStartStudy}
                />
            ) : (
                // Study mode - show one card at a time
                <StudyMode
                    card={currentCard}
                    currentIndex={currentIndex}
                    totalCards={cards.length}
                    flipped={flipped}
                    setFlipped={setFlipped}
                    onNext={handleNext}
                    onPrev={handlePrev}
                    onShuffle={handleShuffle}
                    onEnd={handleEndStudy}
                    artifactId={artifact.id}
                    artifactTitle={artifact.title}
                />
            )}
        </div>
    );
}

/**
 * Browse Mode
 *
 * Grid view of all flashcards.
 */
function BrowseMode({ cards, artifactId, artifactTitle, onStartStudy }) {
    return (
        <div>
            {/* Start study button */}
            <div className="mb-4">
                <Button onClick={onStartStudy}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Start Study Mode
                </Button>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 gap-3">
                {cards.map((card, index) => (
                    <FlashcardPreview
                        key={card.id}
                        card={card}
                        index={index}
                        artifactId={artifactId}
                        artifactTitle={artifactTitle}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Flashcard Preview
 *
 * Small preview of a flashcard in browse mode.
 */
function FlashcardPreview({ card, index, artifactId, artifactTitle }) {
    const { setReference } = useStudyMode();
    const [showBack, setShowBack] = useState(false);
    const containerRef = useRef(null);
    const [showReferenceButton, setShowReferenceButton] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState('');

    const handleMouseUp = useCallback((e) => {
        e.stopPropagation(); // Prevent card flip
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 0 && text.length <= 500) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (containerRect) {
                setButtonPosition({
                    top: rect.top - containerRect.top - 32,
                    left: rect.left - containerRect.left + rect.width / 2,
                });
                setSelectedText(text);
                setShowReferenceButton(true);
            }
        }
    }, []);

    const handleReference = useCallback((e) => {
        e.stopPropagation();
        if (selectedText) {
            setReference(selectedText, artifactId, artifactTitle);
            setShowReferenceButton(false);
            setSelectedText('');
            window.getSelection()?.removeAllRanges();
        }
    }, [selectedText, artifactId, artifactTitle, setReference]);

    const handleClick = useCallback(() => {
        if (!showReferenceButton) {
            setShowBack(!showBack);
        }
        setShowReferenceButton(false);
    }, [showBack, showReferenceButton]);

    return (
        <div
            ref={containerRef}
            className={`
                p-3 rounded-lg border cursor-pointer transition-all relative
                ${card.studied ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white hover:border-violet-300'}
            `}
            onClick={handleClick}
            onMouseUp={handleMouseUp}
        >
            {showReferenceButton && (
                <button
                    className="absolute z-50 flex items-center gap-1 px-2 py-1 bg-violet-600 text-white text-xs font-medium rounded shadow-lg hover:bg-violet-700 transition-colors transform -translate-x-1/2"
                    style={{ top: buttonPosition.top, left: buttonPosition.left }}
                    onClick={handleReference}
                >
                    <Quote className="w-3 h-3" />
                    Reference
                </button>
            )}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Card {index + 1}</span>
                {card.studied && (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                )}
            </div>
            <p className="text-sm text-gray-700 line-clamp-2">
                {showBack ? card.back : card.front}
            </p>
            <p className="text-xs text-gray-400 mt-1">
                {showBack ? 'Back' : 'Front'} - click to flip
            </p>
        </div>
    );
}

/**
 * Study Mode
 *
 * Full-screen study experience with one card at a time.
 */
function StudyMode({
    card,
    currentIndex,
    totalCards,
    flipped,
    setFlipped,
    onNext,
    onPrev,
    onShuffle,
    onEnd,
    artifactId,
    artifactTitle,
}) {
    const { updateArtifact, artifacts, setReference } = useStudyMode();
    const [marking, setMarking] = useState(false);
    const cardRef = useRef(null);
    const [showReferenceButton, setShowReferenceButton] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ top: 0, left: 0 });
    const [selectedText, setSelectedText] = useState('');

    const handleMarkStudied = async () => {
        if (!card || marking) return;

        setMarking(true);

        try {
            const res = await fetch(`/api/study/artifacts/${artifactId}/progress`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId: card.id, studied: true }),
            });

            if (res.ok) {
                const data = await res.json();
                updateArtifact(artifactId, {
                    content: data.data.content,
                });
            }
        } catch (error) {
            console.error('Failed to mark as studied:', error);
        } finally {
            setMarking(false);
        }
    };

    const handleMouseUp = useCallback((e) => {
        e.stopPropagation();
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 0 && text.length <= 500) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const cardRect = cardRef.current?.getBoundingClientRect();

            if (cardRect) {
                setButtonPosition({
                    top: rect.top - cardRect.top - 40,
                    left: rect.left - cardRect.left + rect.width / 2,
                });
                setSelectedText(text);
                setShowReferenceButton(true);
            }
        }
    }, []);

    const handleReferenceClick = useCallback((e) => {
        e.stopPropagation();
        if (selectedText) {
            setReference(selectedText, artifactId, artifactTitle);
            setShowReferenceButton(false);
            setSelectedText('');
            window.getSelection()?.removeAllRanges();
        }
    }, [selectedText, artifactId, artifactTitle, setReference]);

    const handleCardClick = useCallback(() => {
        if (!showReferenceButton) {
            setFlipped(!flipped);
        }
        setShowReferenceButton(false);
    }, [flipped, setFlipped, showReferenceButton]);

    return (
        <div>
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={onShuffle}>
                        <Shuffle className="w-4 h-4 mr-1" />
                        Shuffle
                    </Button>
                    <Button variant="secondary" size="sm" onClick={onEnd}>
                        Exit Study
                    </Button>
                </div>
                <span className="text-sm text-gray-600">
                    {currentIndex + 1} / {totalCards}
                </span>
            </div>

            {/* Card */}
            <div
                ref={cardRef}
                className={`
                    min-h-[200px] p-6 rounded-xl border-2 cursor-pointer relative
                    transition-all duration-300 transform
                    ${flipped ? 'bg-violet-50 border-violet-300' : 'bg-white border-gray-200'}
                    ${card?.studied ? 'ring-2 ring-green-200' : ''}
                `}
                onClick={handleCardClick}
                onMouseUp={handleMouseUp}
            >
                {showReferenceButton && (
                    <button
                        className="absolute z-50 flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-600 text-white text-xs font-medium rounded-lg shadow-lg hover:bg-violet-700 transition-colors transform -translate-x-1/2"
                        style={{ top: buttonPosition.top, left: buttonPosition.left }}
                        onClick={handleReferenceClick}
                    >
                        <Quote className="w-3 h-3" />
                        Reference
                    </button>
                )}
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-medium uppercase tracking-wide ${flipped ? 'text-violet-600' : 'text-gray-500'}`}>
                        {flipped ? 'Answer' : 'Question'}
                    </span>
                    {card?.studied && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            Studied
                        </span>
                    )}
                </div>
                <p className="text-lg text-gray-900">
                    {flipped ? card?.back : card?.front}
                </p>
                <p className="text-sm text-gray-400 mt-4">
                    Click to {flipped ? 'see question' : 'reveal answer'}
                </p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
                <Button
                    variant="secondary"
                    onClick={onPrev}
                    disabled={currentIndex === 0}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </Button>

                {flipped && !card?.studied && (
                    <Button
                        variant="ghost"
                        onClick={handleMarkStudied}
                        loading={marking}
                        className="text-green-600 hover:bg-green-50"
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Mark as Studied
                    </Button>
                )}

                <Button
                    variant="secondary"
                    onClick={onNext}
                    disabled={currentIndex === totalCards - 1}
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 flex gap-1 justify-center">
                {Array.from({ length: totalCards }).map((_, i) => (
                    <div
                        key={i}
                        className={`
                            w-2 h-2 rounded-full transition-colors
                            ${i === currentIndex ? 'bg-violet-500' : 'bg-gray-300'}
                        `}
                    />
                ))}
            </div>
        </div>
    );
}
