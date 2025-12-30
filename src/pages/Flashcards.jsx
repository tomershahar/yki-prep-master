import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WordBankEntry } from '@/entities/WordBankEntry';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, ArrowRight, Shuffle, Volume2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { generateSpeech } from '@/functions/generateSpeech';

const Flashcard = ({ card, isFlipped, onFlip, onPlayAudio }) => {
    return (
        <div className="relative w-full h-64 md:h-80 perspective-1000">
            <div 
                className={`w-full h-full transform-style-3d transition-transform duration-700 ${isFlipped ? 'rotate-y-180' : ''}`}
            >
                {/* Front of Card */}
                <Card 
                    className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 cursor-pointer"
                    onClick={onFlip}
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-center capitalize">{card.word}</h2>
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={(e) => { e.stopPropagation(); onPlayAudio(card.word, card.language); }}>
                        <Volume2 className="w-6 h-6" />
                    </Button>
                </Card>

                {/* Back of Card */}
                <Card 
                    className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 cursor-pointer"
                    onClick={onFlip}
                >
                    <div className="text-center space-y-4">
                        <p className="text-2xl font-semibold text-blue-600">{card.translation}</p>
                        <div className="border-t pt-4 w-full">
                            <p className="text-sm text-gray-500">Example:</p>
                            <p className="text-md italic text-gray-700">"{card.example_sentence}"</p>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={(e) => { e.stopPropagation(); onPlayAudio(card.example_sentence, card.language); }}>
                        <Volume2 className="w-6 h-6" />
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default function Flashcards() {
    const [words, setWords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const loadWords = async () => {
            setIsLoading(true);
            try {
                const entries = await WordBankEntry.list();
                setWords(entries);
            } catch (error) {
                console.error("Failed to load words:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadWords();
    }, []);

    const shuffledWords = useMemo(() => {
        return [...words].sort(() => Math.random() - 0.5);
    }, [words]);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % shuffledWords.length);
        }, 300);
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + shuffledWords.length) % shuffledWords.length);
        }, 300);
    };

    const handleShuffle = () => {
        // This will trigger a re-render with a new shuffled list due to state change
        setWords([...words]); 
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    const playAudio = useCallback(async (text, language) => {
        try {
            const { data } = await generateSpeech({ text_to_speak: text, language });
            if (data.status === 'success') {
                const audioSrc = `data:audio/mpeg;base64,${data.audio_base64}`;
                new Audio(audioSrc).play();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("Failed to play audio:", error);
        }
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-10 h-10 animate-spin" /></div>;
    }

    if (shuffledWords.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-center p-4">
                <h2 className="text-2xl font-bold mb-4">No words to practice!</h2>
                <p className="text-gray-600 mb-6">Add some words to your Word Bank to start practicing with flashcards.</p>
                <Link to={createPageUrl("WordBank")}><Button>Go to Word Bank</Button></Link>
            </div>
        );
    }
    
    const currentCard = shuffledWords[currentIndex];

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-lg font-medium text-gray-700">
                        Card {currentIndex + 1} of {shuffledWords.length}
                    </p>
                    <Link to={createPageUrl("WordBank")}>
                        <Button variant="ghost">
                            <X className="w-5 h-5 mr-2"/>
                            Exit Practice
                        </Button>
                    </Link>
                </div>

                <Flashcard 
                    card={currentCard}
                    isFlipped={isFlipped}
                    onFlip={() => setIsFlipped(!isFlipped)}
                    onPlayAudio={playAudio}
                />

                <div className="flex justify-center items-center gap-4 mt-6">
                    <Button variant="outline" size="lg" onClick={handlePrev}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <Button size="lg" onClick={handleShuffle}>
                        <Shuffle className="w-6 h-6 mr-2" />
                        Shuffle
                    </Button>
                    <Button variant="outline" size="lg" onClick={handleNext}>
                        <ArrowRight className="w-6 h-6" />
                    </Button>
                </div>
            </div>
             <style jsx global>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; }
            `}</style>
        </div>
    );
}