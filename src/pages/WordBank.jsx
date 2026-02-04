import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { WordBankEntry } from '@/entities/WordBankEntry';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Trash2, Library, Volume2, PlayCircle, BookOpen } from 'lucide-react';
import { generateSpeech } from '@/functions/generateSpeech';

const WordCard = ({ entry, onDelete, onPlayAudio }) => {
    // Sanitize all user/AI-generated content
    const sanitizedWord = DOMPurify.sanitize(entry.word || '', { ALLOWED_TAGS: [] });
    const sanitizedTranslation = DOMPurify.sanitize(entry.translation || '', { ALLOWED_TAGS: [] });
    const sanitizedExample = DOMPurify.sanitize(entry.example_sentence || '', { ALLOWED_TAGS: [] });

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-bold capitalize">{sanitizedWord}</CardTitle>
                        <CardDescription className="text-lg text-blue-600">{sanitizedTranslation}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onPlayAudio(sanitizedWord)}>
                        <Volume2 className="w-5 h-5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="border-t pt-4 mt-2">
                    <p className="text-sm text-gray-500 mb-2">Example Sentence:</p>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onPlayAudio(sanitizedExample)}>
                            <Volume2 className="w-4 h-4" />
                        </Button>
                        <p className="text-gray-700 italic">"{sanitizedExample}"</p>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <Button variant="destructive" size="sm" onClick={() => onDelete(entry.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default function WordBank() {
    const [words, setWords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [audio, setAudio] = useState(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);

    useEffect(() => {
        loadWords();
    }, []);

    const loadWords = async () => {
        setIsLoading(true);
        try {
            const entries = await WordBankEntry.list('-created_date');
            setWords(entries);
        } catch (error) {
            console.error("Failed to load word bank:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this word?')) {
            try {
                await WordBankEntry.delete(id);
                setWords(words.filter(w => w.id !== id));
            } catch (error) {
                console.error("Failed to delete word:", error);
                alert('Could not delete word. Please try again.');
            }
        }
    };

    const playAudio = useCallback(async (text, language) => {
        setIsAudioLoading(true);
        try {
            const { data } = await generateSpeech({
                text_to_speak: text,
                language: language 
            });
            if (data.status === 'success') {
                const audioSrc = `data:audio/mpeg;base64,${data.audio_base64}`;
                const newAudio = new Audio(audioSrc);
                setAudio(newAudio);
                newAudio.play();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error("Failed to play audio:", error);
            alert('Could not play audio.');
        } finally {
            setIsAudioLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                        <Library className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">My Word Bank</h1>
                        <p className="text-gray-600">Your personal collection of saved words.</p>
                    </div>
                </div>
                {words.length > 0 && (
                    <Link to={createPageUrl("Flashcards")}>
                        <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90">
                            <PlayCircle className="w-5 h-5 mr-2" />
                            Practice with Flashcards
                        </Button>
                    </Link>
                )}
            </div>

            {words.length === 0 ? (
                <Card className="text-center p-8">
                    <CardHeader>
                        <BookOpen className="w-12 h-12 mx-auto text-gray-400" />
                        <CardTitle className="mt-4">Your Word Bank is Empty</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">Start by selecting words during reading practice to save them here.</p>
                        <Link to={createPageUrl("Practice")}>
                            <Button className="mt-4">Go to Practice</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {words.map(entry => (
                        <WordCard 
                            key={entry.id} 
                            entry={entry} 
                            onDelete={handleDelete} 
                            onPlayAudio={(text) => playAudio(text, entry.language)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}