import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, ArrowRight, ArrowLeft, Check, X, Sparkles, Loader2, Mic, Square, RefreshCw, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ReactMarkdown from 'react-markdown';
import { InvokeLLM, UploadFile } from "@/integrations/Core";
import { KnowledgeBaseContent } from "@/entities/KnowledgeBaseContent";
import ExamSummary from './ExamSummary';
import AudioPlayer from './AudioPlayer';
import { transcribeAudio } from '@/functions/transcribeAudio';
import InlineTranslator from '../shared/InlineTranslator';
import { gradeSpeaking } from "@/functions/gradeSpeaking";
import { gradeWriting } from "@/functions/gradeWriting";

// Speaking Task Component
const SpeakingTask = ({ task, taskIndex, onAnswerSubmit, isSubmitting, language, difficulty }) => {
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);

    const [audioBase64, setAudioBase64] = useState(null); // Store base64 for AudioPlayer
    const [error, setError] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);

    // States for review flow
    const [taskState, setTaskState] = useState('idle'); // idle, recording, transcribing, reviewing, submitted
    const [transcribedText, setTranscribedText] = useState('');

    useEffect(() => {
        return () => {
            // Cleanup timer and media recorder on component unmount
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleStartRecording = async () => {
        setError(null); // Clear previous errors
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleAudioUpload(audioBlob, stream); // Pass stream to stop tracks
            };

            mediaRecorderRef.current.start();
            setTaskState('recording');
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= 120) { // Max 2 minutes
                        handleStopRecording();
                        return 120;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err) {
            console.error("Error starting recording:", err);
            setError("Could not access microphone. Please check your browser permissions.");
            setTaskState('idle');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        // Stop all tracks on the stream to turn off the mic indicator
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const handleAudioUpload = async (audioBlob, stream) => {
        setTaskState('transcribing');
        setError(null);
        try {
            // Keep a local base64 version for the audio player
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                setAudioBase64(reader.result);
            };

            // Convert Blob to File object for the UploadFile integration
            const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, {
                type: 'audio/webm'
            });

            // Upload the file to get a URL for the backend function
            const { file_url, error: uploadError } = await UploadFile({ file: audioFile });
            if (uploadError || !file_url) {
                throw new Error(uploadError?.message || "File upload failed, please try again.");
            }

            // Call the backend function with the file URL
            const { data, error: transcribeError } = await transcribeAudio({
                file_url: file_url,
                language: language,
            });

            if (transcribeError || (data && data.error)) {
                throw new Error(transcribeError?.message || data?.error || "Transcription failed.");
            }

            if (data.transcription !== undefined) {
                setTranscribedText(data.transcription);
                setTaskState('reviewing');
            } else {
                throw new Error("Invalid response from transcription service.");
            }
        } catch (err) {
            console.error("Transcription process error:", err);
            setError(err.message || "Failed to transcribe audio. Please try recording again.");
            setTaskState('idle');
        } finally {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    // Handler for re-recording
    const handleRerecord = () => {
        setTaskState('idle');
        setTranscribedText('');
        setAudioBase64(null);
        setError(null);
        setRecordingTime(0);
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    // Handler for submitting the final transcription to the parent
    const handleSubmit = () => {
        onAnswerSubmit(transcribedText, taskIndex);
        setTaskState('submitted');
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card key={taskIndex} className="bg-white shadow-sm border">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Badge variant="secondary"><InlineTranslator sourceLanguage={language}>{task.task_type || 'Speaking Task'}</InlineTranslator></Badge>
                        </CardTitle>
                        <CardDescription className="mt-1 text-gray-600">
                            <span className="font-medium">Prompt:</span> <InlineTranslator sourceLanguage={language}>{task.prompt}</InlineTranslator>
                        </CardDescription>
                        {task.time_limit && (
                            <p className="text-sm text-blue-600 mt-2">
                                <strong>Time limit:</strong> <InlineTranslator sourceLanguage={language}>{task.time_limit}</InlineTranslator>
                            </p>
                        )}
                    </div>
                    {taskState === 'submitted' && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1" />Submitted</Badge>}
                </div>
            </CardHeader>
            <CardContent>
                {taskState === 'idle' && (
                    <Button onClick={handleStartRecording} disabled={isSubmitting}>
                        <Mic className="w-4 h-4 mr-2" /> Start Recording
                    </Button>
                )}
                {taskState === 'recording' && (
                    <div className="flex items-center gap-4">
                        <Button onClick={handleStopRecording} variant="destructive">
                            <Square className="w-4 h-4 mr-2" /> Stop Recording
                        </Button>
                        <div className="flex items-center gap-2 text-red-600 font-mono text-lg">
                            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                            <span>{formatTime(recordingTime)}</span>
                        </div>
                    </div>
                )}
                {taskState === 'transcribing' && (
                    <div className="flex items-center gap-2 text-gray-500 p-4 bg-gray-50 rounded-md">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Transcribing your audio... This may take a moment.</span>
                    </div>
                )}
                {taskState === 'reviewing' && (
                    <div className="space-y-4">
                        {audioBase64 && (
                            <div className="pt-4">
                                <p className="text-sm font-medium mb-1 text-gray-600">Listen to your recording:</p>
                                <AudioPlayer audioBase64={audioBase64} />
                            </div>
                        )}
                        <div>
                            <Label htmlFor={`transcription-${taskIndex}`}>Your transcribed response (you can edit if needed):</Label>
                            <Textarea
                                id={`transcription-${taskIndex}`}
                                value={transcribedText}
                                onChange={(e) => setTranscribedText(e.target.value)}
                                className="mt-2 min-h-28 text-base"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleSubmit} disabled={isSubmitting}>
                                <Send className="w-4 h-4 mr-2" /> Confirm Transcription
                            </Button>
                            <Button onClick={handleRerecord} variant="outline" disabled={isSubmitting}>
                                <RefreshCw className="w-4 h-4 mr-2" /> Re-record
                            </Button>
                        </div>
                    </div>
                )}
                {taskState === 'submitted' && (
                    <div className="p-4 bg-gray-50 border rounded-md">
                        <p className="font-medium text-gray-800">Your confirmed response:</p>
                        <p className="text-gray-600 mt-2 whitespace-pre-wrap"><InlineTranslator sourceLanguage={language}>{transcribedText}</InlineTranslator></p>
                    </div>
                )}
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertTitle>Recording Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

const normalizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/\s+/g, ' ')
        .replace(/[.!?;,]+$/, '') // Remove punctuation at the end of the string
        .toLowerCase();
};

export default function QuickPracticeSession({ section, exam, onComplete, onCancel }) {
    const [examContent, setExamContent] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [scoreData, setScoreData] = useState(null);
    const [isGrading, setIsGrading] = useState(false);
    const [aiFeedback, setAiFeedback] = useState({});
    const [writingWeakSpots, setWritingWeakSpots] = useState(null);
    const submissionInProgress = useRef(false); // FIXED: Prevent duplicate submissions

    // Effect for initial exam content loading
    useEffect(() => {
        if (exam && exam.content) {
            try {
                const content = JSON.parse(exam.content);
                setExamContent(content);
            } catch (error) {
                console.error("Error parsing exam content:", error);
                setExamContent(null);
            }
        }
        
        // Load weak spots for writing
        if (section.id === 'writing' && exam.weak_spots) {
            setWritingWeakSpots(exam.weak_spots);
        }
    }, [exam, section.id]);

    // Effect for iOS Chrome microphone warning
    useEffect(() => {
        if (section.id === 'speaking') {
            const userAgent = navigator.userAgent;
            const isIOSChrome = /CriOS/.test(userAgent) && /iPhone|iPad/.test(userAgent);
            if (isIOSChrome) {
                alert("⚠️ Recording doesn't work properly in Chrome on iPhone/iPad.\n\nFor the best speaking practice experience, please:\n1. Open this page in Safari instead\n2. Or switch to Safari for speaking practice\n\nYou can continue, but recording may not work correctly.");
            }
        }
    }, [section.id]);

    const handleAnswerChange = (questionIndex, answer) => {
        if (!showResults && !showSummary) {
            setAnswers(prev => ({
                ...prev,
                [questionIndex]: answer
            }));
        }
    };

    const handleSpeakingAnswer = (transcription, taskIndex) => {
        setAnswers(prev => ({
            ...prev,
            [taskIndex]: { answer: transcription, task: examContent.tasks[taskIndex] } // Store task along with answer
        }));
    };

    const handleNext = () => {
        const totalQuestions = examContent?.questions?.length || examContent?.tasks?.length || 0;
        if (currentQuestion < totalQuestions - 1) {
            setCurrentQuestion(prev => prev + 1);
            setShowResults(false);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
            setShowResults(false);
        }
    };

    const gradeWritingWithAI = async (task, userAnswer, difficulty, chosenPrompt) => {
        try {
            console.log('Calling backend writing grading function...');
            
            // Validate weak spots data
            const validatedWeakSpots = Array.isArray(writingWeakSpots?.weakSpots) 
                ? writingWeakSpots.weakSpots 
                : [];
            
            const response = await gradeWriting({
                task,
                userResponse: userAnswer,
                difficulty,
                language: exam.language,
                weakSpots: validatedWeakSpots
            });

            console.log('Raw backend response:', response);

            let result;
            if (response && response.data) {
                if (response.error) {
                    throw new Error(response.error.message || 'Backend grading failed');
                }
                result = response.data;
            } else if (response && response.scores) {
                result = response;
            } else {
                throw new Error('Invalid response format from backend');
            }

            // Validate the result structure and score ranges
            if (!result.scores || typeof result.total_score !== 'number' || !result.feedback || typeof result.cefr_level !== 'string') {
                console.error('Invalid result structure received:', result);
                throw new Error('Backend returned invalid grading structure');
            }
            
            // Validate score ranges (each criterion 1-8, total 4-32)
            const scores = result.scores;
            const scoreKeys = Object.keys(scores);
            for (const key of scoreKeys) {
                if (typeof scores[key] !== 'number' || scores[key] < 1 || scores[key] > 8) {
                    console.error(`Invalid score for ${key}: ${scores[key]}`);
                    throw new Error(`Invalid score range for ${key}: must be between 1-8`);
                }
            }
            
            if (result.total_score < 4 || result.total_score > 32) {
                console.error(`Invalid total_score: ${result.total_score}`);
                throw new Error('Invalid total_score: must be between 4-32');
            }

            console.log('Backend writing grading completed successfully:', result);
            return result;
        } catch (error) {
            console.error("Writing grading error:", error);
            // FIXED: Preserve user input on error by keeping it in state
            throw error;
        }
    };

    const gradeSpeakingWithAI = async (task, userTranscription, difficulty) => {
        try {
            console.log('Calling backend speaking grading function...');
            const response = await gradeSpeaking({
                task,
                userTranscription,
                difficulty,
                language: exam.language
            });

            console.log('Raw backend response:', response);

            let result;
            if (response && response.data) { // Check if it's { data, error } format
                if (response.error) {
                    throw new Error(response.error.message || 'Backend grading failed (response.error)');
                }
                result = response.data;
            } else if (response && response.scores) { // Direct result format
                result = response;
            } else {
                throw new Error('Invalid response format from backend');
            }

            // Validate the result structure and score ranges
            if (!result.scores || typeof result.total_score !== 'number' || !result.feedback || typeof result.cefr_level !== 'string') {
                console.error('Invalid result structure received:', result);
                throw new Error('Backend returned invalid grading structure');
            }
            
            // Validate score ranges for speaking
            const scores = result.scores;
            const scoreKeys = Object.keys(scores);
            for (const key of scoreKeys) {
                if (typeof scores[key] !== 'number' || scores[key] < 1 || scores[key] > 8) {
                    console.error(`Invalid score for ${key}: ${scores[key]}`);
                    throw new Error(`Invalid score range for ${key}: must be between 1-8`);
                }
            }
            
            if (result.total_score < 4 || result.total_score > 32) {
                console.error(`Invalid total_score: ${result.total_score}`);
                throw new Error('Invalid total_score: must be between 4-32');
            }

            console.log('Backend grading completed successfully:', result);
            return result;
        } catch (error) {
            console.error("Speaking grading error:", error);
            throw error;
        }
    };

    const calculateScore = (currentFeedback = aiFeedback) => {
        if (!examContent) return { score: 0, correct: 0, total: 0 };

        if (section.id === 'reading' || section.id === 'listening') {
            const questions = examContent.questions || [];
            if (!questions.length) return { score: 0, correct: 0, total: 0 };

            let correctAnswers = 0;
            const totalQuestions = questions.length;

            questions.forEach((question, index) => {
                const userAnswer = answers[index]; // Full text of selected option for MC, or typed text for input.
                const correctAnswerFromAI = question.correct_answer; // Could be a letter (A, B) OR the full text.

                if (userAnswer === undefined || userAnswer === null || userAnswer === '') {
                    // User did not answer this question, so it's not correct.
                    return;
                }

                let isCorrect = false;

                if (question.question_type === 'multiple_choice') {
                    // Case 1: The AI returned a letter (e.g., "B").
                    // We need to compare the user's selected option text with the option corresponding to the correct letter.
                    if (correctAnswerFromAI && correctAnswerFromAI.length === 1 && correctAnswerFromAI.toUpperCase() >= 'A' && correctAnswerFromAI.toUpperCase() <= 'Z') {
                        const correctOptionIndex = correctAnswerFromAI.toUpperCase().charCodeAt(0) - 65;
                        if (question.options && question.options[correctOptionIndex]) {
                            const correctOptionText = question.options[correctOptionIndex];
                            if (normalizeString(userAnswer) === normalizeString(correctOptionText)) {
                                isCorrect = true;
                            }
                        }
                    }
                    // Case 2: The AI returned the full text of the answer.
                    // We directly compare the user's selected option text with the AI's provided correct answer text.
                    else {
                        if (normalizeString(userAnswer) === normalizeString(correctAnswerFromAI)) {
                            isCorrect = true;
                        }
                    }
                } else {
                    // For non-multiple choice questions (e.g., text input),
                    // userAnswer is the typed text, and correctAnswerFromAI is the correct text.
                    // Direct comparison after normalization is appropriate.
                    if (normalizeString(userAnswer) === normalizeString(correctAnswerFromAI)) {
                        isCorrect = true;
                    }
                }

                if (isCorrect) {
                    correctAnswers++;
                }
            });

            const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

            return {
                score: score,
                correct: correctAnswers,
                total: totalQuestions
            };
        } else { // For writing/speaking
            const tasks = examContent.tasks || [];
            if (!tasks.length) return { score: 0, correct: 0, total: 0 };

            let totalAggregateScore = 0;
            let gradedTasks = 0;
            let aggregateCEFR = null;

            for (let i = 0; i < tasks.length; i++) {
                if (currentFeedback[i] && typeof currentFeedback[i].total_score === 'number') {
                    totalAggregateScore += currentFeedback[i].total_score;
                    gradedTasks++;
                    // Use CEFR from the first graded task or an average strategy if multiple tasks have CEFRs
                    // For simplicity, take the last non-null CEFR, or first.
                    if (currentFeedback[i].cefr_level) {
                        aggregateCEFR = currentFeedback[i].cefr_level;
                    }
                }
            }

            // Total score is out of 32 for writing/speaking (4 criteria * 8 points each)
            const averageScore32 = gradedTasks > 0 ? totalAggregateScore / gradedTasks : 0;
            const averageScore100 = Math.round((averageScore32 / 32) * 100);

            let overallFeedbackObject = null;
            if (gradedTasks > 0) {
                // Aggregate strengths and weaknesses from all graded tasks for a general summary
                const allStrengths = Object.values(currentFeedback)
                    .filter(fb => fb && fb.feedback && fb.feedback.strengths)
                    .map(fb => fb.feedback.strengths)
                    .join(' ');
                const allWeaknesses = Object.values(currentFeedback)
                    .filter(fb => fb && fb.feedback && fb.feedback.weaknesses)
                    .map(fb => fb.feedback.weaknesses)
                    .join(' ');

                overallFeedbackObject = {
                    strengths: allStrengths || "No specific strengths identified.",
                    weaknesses: allWeaknesses || "No specific weaknesses identified."
                };
            }

            return {
                score: averageScore100,
                correct: gradedTasks > 0 ? (averageScore100 >= 75 ? 1 : 0) : 0, // Simplified correct/incorrect for pass/fail
                total: gradedTasks,
                overallFeedback: overallFeedbackObject,
                cefr_level: aggregateCEFR
            };
        }
    };

    const handleSubmit = async () => {
        // FIXED: Prevent duplicate submissions
        if (submissionInProgress.current) {
            console.log('Submission already in progress, ignoring duplicate request');
            return;
        }
        
        submissionInProgress.current = true;
        setIsSubmitting(true);
        setIsGrading(true);

        try {
            const items = examContent.questions || examContent.tasks || [];
            const isLastQuestion = currentQuestion === items.length - 1;

            // For listening, submit all at once and go to summary
            if (section.id === 'listening') {
                const calculatedScore = calculateScore();
                setScoreData({ ...calculatedScore, overallFeedback: null });
                setShowSummary(true);
                return; // Exit early for listening
            }

            // For writing and speaking, perform AI grading
            if (section.id === 'writing' || section.id === 'speaking') {
                const tasksToGrade = (section.id === 'speaking')
                    ? items.map((task, index) => ({ task, index })).filter(({ index }) => answers[index] && answers[index].answer)
                    : [{ task: items[currentQuestion], index: currentQuestion }];

                if (tasksToGrade.length === 0) {
                    console.log('No tasks to grade. Submitting directly without grading.');
                    if (isLastQuestion || section.id === 'speaking') {
                        // If no tasks to grade for speaking, just show summary with current (empty) feedback
                        const calculatedScore = calculateScore(aiFeedback);
                        setScoreData(calculatedScore);
                        setShowSummary(true);
                    } else {
                        // For writing, if no answer for current, just move to next
                        setCurrentQuestion(prev => prev + 1);
                    }
                    return; // Exit handleSubmit
                }

                console.log(`Starting to grade ${tasksToGrade.length} tasks`);

                // Create grading promises with enhanced error handling
                const gradingPromises = tasksToGrade.map(async ({ task, index }) => {
                    const userAnswer = answers[index]?.answer || answers[index] || "";

                    try {
                        let result;
                        if (section.id === 'writing') {
                            // Word count validation with proper penalty application
                            const wordCount = userAnswer.split(/\s+/).filter(word => word.length > 0).length;
                            let expectedWordCountMin = 0;
                            let wordCountPenalty = 0;
                            
                            if (task.word_count) {
                                // Handle ranges like "40-60 words"
                                const rangeMatch = task.word_count.match(/(\d+)\s*-\s*(\d+)/);
                                if (rangeMatch) {
                                    expectedWordCountMin = parseInt(rangeMatch[1]);
                                } else {
                                    const singleMatch = task.word_count.match(/(\d+)/);
                                    if (singleMatch) expectedWordCountMin = parseInt(singleMatch[1]);
                                }
                            }
                            
                            // Calculate penalty if word count is too low (less than 70% of expected)
                            const WORD_COUNT_THRESHOLD = 0.7;
                            const PENALTY_PER_10_WORDS = 1;
                            
                            if (expectedWordCountMin > 0 && wordCount < expectedWordCountMin * WORD_COUNT_THRESHOLD) {
                                const shortfall = (expectedWordCountMin * WORD_COUNT_THRESHOLD) - wordCount;
                                wordCountPenalty = Math.max(1, Math.round(shortfall / 10) * PENALTY_PER_10_WORDS);
                                console.log(`Word count penalty: -${wordCountPenalty} points (${wordCount}/${expectedWordCountMin} words)`);
                            }
                            
                            result = await gradeWritingWithAI(task, userAnswer, exam.difficulty, task.prompt);
                            
                            // FIXED: Apply the word count penalty to the total score
                            if (wordCountPenalty > 0 && result.total_score) {
                                const originalScore = result.total_score;
                                result.total_score = Math.max(4, result.total_score - wordCountPenalty);
                                console.log(`Applied word count penalty: ${originalScore} -> ${result.total_score}`);
                            }
                        } else {
                            // Use backend function for speaking
                            console.log(`Grading speaking task ${index}`);
                            result = await gradeSpeakingWithAI(task, userAnswer, exam.difficulty);
                        }

                        console.log(`Task ${index} graded successfully:`, result);
                        return { index, result, success: true };
                    } catch (error) {
                        console.error(`Grading failed for task ${index}:`, error);
                        
                        // IMPROVED: Instead of providing fake low scores, return a grading failure
                        return {
                            index,
                            error: error.message,
                            success: false,
                            gradingFailed: true // New flag to indicate grading failure
                        };
                    }
                });

                console.log('Waiting for all grading to complete...');
                const gradingResults = await Promise.all(gradingPromises);
                console.log('All grading completed:', gradingResults);

                // Check if any grading failed
                const failedGrading = gradingResults.find(result => result.gradingFailed);
                
                // FIXED: Add retry limit to prevent infinite recursion
                const MAX_RETRIES = 3;
                const retryCount = (window.gradingRetryCount || 0);
                
                if (failedGrading) {
                    if (retryCount >= MAX_RETRIES) {
                        // Max retries exceeded, treat as ungraded
                        console.log('Max retries exceeded, treating as ungraded practice');
                        window.gradingRetryCount = 0; // Reset counter
                        
                        const ungradedScore = {
                            score: 0,
                            correct: 0,
                            total: tasksToGrade.length,
                            gradingFailed: true,
                            overallFeedback: {
                                strengths: "Your response was saved but could not be graded after multiple attempts.",
                                weaknesses: "Please try this practice again later when the grading service is available."
                            },
                            cefr_level: 'Unknown'
                        };
                        setScoreData(ungradedScore);
                        setShowSummary(true);
                        return;
                    }
                    
                    // Still have retries left
                    const retryGrading = confirm(
                        `AI grading failed due to: ${failedGrading.error}\n\n` +
                        `Would you like to try grading again? (Attempt ${retryCount + 1}/${MAX_RETRIES})\n\n` +
                        `If you choose "Cancel", your practice will be saved but won't count toward your progress.`
                    );
                    
                    if (retryGrading) {
                        // Retry grading with incremented counter
                        console.log(`User chose to retry grading (attempt ${retryCount + 1})`);
                        window.gradingRetryCount = retryCount + 1;
                        return handleSubmit();
                    } else {
                        // Reset counter on user cancel
                        window.gradingRetryCount = 0;
                        // User chose to skip grading - treat as ungraded practice
                        console.log('User chose to skip grading');
                        const ungradedScore = {
                            score: 0, // Set to 0 if an actual number is expected, otherwise null
                            correct: 0,
                            total: tasksToGrade.length,
                            gradingFailed: true,
                            overallFeedback: {
                                strengths: "Your response was saved but could not be graded due to a technical issue.",
                                weaknesses: "You can try this practice again later when the grading service is available."
                            },
                            cefr_level: 'Unknown' // Add CEFR for consistency in scoreData
                        };
                        setScoreData(ungradedScore);
                        setShowSummary(true);
                        return;
                    }
                }

                // FIXED: Reset retry counter on success
                window.gradingRetryCount = 0;
                
                // Update feedback with successful results only
                const newFeedback = { ...aiFeedback };
                gradingResults.forEach(({ index, result, success }) => {
                    if (success) {
                        newFeedback[index] = result;
                    }
                });

                console.log('Setting AI feedback:', newFeedback);
                setAiFeedback(newFeedback);

                // Calculate score with new feedback
                console.log('Calculating final score...');
                const calculatedScore = calculateScore(newFeedback);
                console.log('Calculated score:', calculatedScore);

                setScoreData(calculatedScore);

                // For speaking, show summary after all tasks are graded
                if (section.id === 'speaking') {
                    console.log('Showing summary for speaking');
                    setShowSummary(true);
                } else if (isLastQuestion) {
                    // For writing, show summary if it's the last question
                    console.log('Showing summary for writing (last question)');
                    setShowSummary(true);
                } else {
                    // For writing, continue to next question
                    console.log('Moving to next writing question');
                    setCurrentQuestion(prev => prev + 1);
                }
            } else { // For reading
                if (isLastQuestion) {
                    const calculatedScore = calculateScore();
                    setScoreData({ ...calculatedScore, overallFeedback: null });
                    setShowSummary(true);
                } else {
                    setShowResults(true);
                }
            }
        } catch (error) {
            console.error("Critical error in handleSubmit:", error);
            alert(`An unexpected error occurred: ${error.message}. Please try again.`);
        } finally {
            setIsSubmitting(false);
            setIsGrading(false);
            submissionInProgress.current = false; // FIXED: Reset submission flag
        }
    };

    const handleFinalizePractice = (markAsCompleted) => {
        if (!scoreData) {
            console.error("Score data not available when finalizing practice.");
            alert("Error: Practice results are not available. Please try the practice again.");
            return;
        }

        try {
            // IMPROVED: Handle ungraded practices
            if (scoreData.gradingFailed) {
                const sessionData = {
                    section: section.id,
                    score: 0, // Set score to 0 for failed grading, but don't count toward progress
                    questions_attempted: scoreData.total || 1,
                    questions_correct: 0,
                    duration_minutes: 10,
                    difficulty_level: exam.difficulty || 'A1',
                    answers: answers || {},
                    feedback: { error: 'Grading failed due to technical issue. Review your answers in the summary.' },
                    detailed_feedback: null,
                    cefr_level: scoreData.cefr_level || 'Unknown' // Use 'Unknown' for CEFR
                };
                
                // Don't mark as completed since grading failed
                onComplete(sessionData, exam.practiceId, false);
                return;
            }

            const sessionData = {
                section: section.id,
                score: scoreData.score || 0,
                questions_attempted: scoreData.total || 1,
                questions_correct: scoreData.correct || 0,
                duration_minutes: 10,
                difficulty_level: exam.difficulty || 'A1',
                answers: answers || {}, // For speaking, this will be objects
                feedback: scoreData.overallFeedback || null,
                detailed_feedback: aiFeedback || null,
                cefr_level: scoreData.cefr_level || 'A1'
            };

            console.log('Finalizing practice with session data:', sessionData);

            if (!sessionData.section) {
                throw new Error('Missing section information');
            }

            if (sessionData.score === undefined || sessionData.score === null) {
                throw new Error('Missing score information');
            }

            onComplete(sessionData, exam.practiceId, markAsCompleted);
        } catch (error) {
            console.error('Error completing practice:', error);
            alert(`Error completing practice: ${error.message}. Please try again.`);
        }
    };

    const handleRestartPractice = () => {
        setAnswers({});
        setCurrentQuestion(0);
        setShowResults(false);
        setShowSummary(false);
        setScoreData(null);
        setAiFeedback({});
    };

    // Show summary page
    if (showSummary && scoreData) {
        return (
            <ExamSummary
                section={section}
                examContent={examContent}
                answers={answers}
                scoreData={scoreData}
                aiFeedback={aiFeedback}
                onRestart={handleRestartPractice}
                onExit={handleFinalizePractice}
                isStaticPractice={exam.source === 'static'}
            />
        );
    }

    if (!examContent) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
                <h2 className="text-xl font-bold text-gray-800">Loading Exam Content...</h2>
            </div>
        );
    }

    const items = examContent.questions || examContent.tasks || [];

    if (items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Content Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">There was an issue loading the exam content. The AI did not provide any questions or tasks for this session. This can sometimes happen with on-demand generation.</p>
                        <Button onClick={onCancel} variant="outline" className="mt-4">Go Back to Practice Menu</Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderQuestion = (item, index) => {
        if (section.id === 'reading' || section.id === 'listening') {
            const question = item;
            // Determine correctness based on the logic in calculateScore
            let isCorrect = false;
            let isWrong = false;

            if (showResults && answers[index] !== undefined && answers[index] !== null) {
                const userAnswer = answers[index];
                const correctAnswerFromAI = question.correct_answer;

                if (question.question_type === 'multiple_choice') {
                    // Case 1: The AI returned a letter (e.g., "B").
                    if (correctAnswerFromAI && correctAnswerFromAI.length === 1 && correctAnswerFromAI.toUpperCase() >= 'A' && correctAnswerFromAI.toUpperCase() <= 'Z') {
                        const correctOptionIndex = correctAnswerFromAI.toUpperCase().charCodeAt(0) - 65;
                        if (question.options && question.options[correctOptionIndex]) {
                            const correctOptionText = question.options[correctOptionIndex];
                            isCorrect = normalizeString(userAnswer) === normalizeString(correctOptionText);
                        }
                    }
                    // Case 2: The AI returned the full text of the answer.
                    else {
                        isCorrect = normalizeString(userAnswer) === normalizeString(correctAnswerFromAI);
                    }
                } else { // For text input questions
                    isCorrect = normalizeString(userAnswer) === normalizeString(correctAnswerFromAI);
                }
                isWrong = !isCorrect && userAnswer !== '';
            }

            return (
                <div className="space-y-4 mb-6 p-4 rounded-lg border bg-white">
                    <div className={`p-4 rounded-lg border-2 ${showResults ? (isCorrect ? 'border-green-500 bg-green-50' : isWrong ? 'border-red-500 bg-red-50' : 'border-gray-200') : 'border-gray-200'}`}>
                        <div className="flex items-start gap-3">
                            {showResults && (
                                <div className="mt-1">
                                    {isCorrect ? <Check className="w-5 h-5 text-green-600" /> : isWrong ? <X className="w-5 h-5 text-red-600" /> : <div className="w-5 h-5 rounded-full bg-gray-300" />}
                                </div>
                            )}
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-semibold text-lg">{index + 1}. <InlineTranslator sourceLanguage={exam.language}>{question.question}</InlineTranslator></p>
                                </div>
                                {question.question_type === 'multiple_choice' ? (
                                    <RadioGroup value={answers[index] || ''} onValueChange={(value) => handleAnswerChange(index, value)} disabled={showResults}>
                                        {question.options?.map((option, optionIndex) => {
                                            const optionLetter = String.fromCharCode(65 + optionIndex);
                                            
                                            // Determine if this specific option is the correct one for display
                                            let isThisOptionCorrect = false;
                                            if (question.correct_answer) {
                                                if (question.correct_answer.length === 1 && question.correct_answer.toUpperCase() >= 'A' && question.correct_answer.toUpperCase() <= 'Z') {
                                                    // Correct answer is a letter, compare with current option's letter
                                                    isThisOptionCorrect = normalizeString(optionLetter) === normalizeString(question.correct_answer);
                                                } else {
                                                    // Correct answer is the full text, compare with current option's text
                                                    isThisOptionCorrect = normalizeString(option) === normalizeString(question.correct_answer);
                                                }
                                            }

                                            // Determine if this option was selected by the user
                                            const isOptionSelected = showResults && normalizeString(option) === normalizeString(answers[index]);

                                            return (
                                                <div key={optionIndex} className={`flex items-center space-x-2 p-2 rounded ${showResults && isThisOptionCorrect ? 'bg-green-100 border border-green-300' : isOptionSelected && !isThisOptionCorrect ? 'bg-red-100 border border-red-300' : ''}`}>
                                                    <RadioGroupItem value={option} id={`q${index}_${optionIndex}`} />
                                                    <Label htmlFor={`q${index}_${optionIndex}`} className="cursor-pointer flex-1">
                                                        <InlineTranslator sourceLanguage={exam.language}>{option}</InlineTranslator>
                                                        {showResults && isThisOptionCorrect && <Check className="w-4 h-4 text-green-600 inline ml-2" />}
                                                    </Label>
                                                </div>
                                            );
                                        })}
                                    </RadioGroup>
                                ) : (
                                    <Input
                                        value={answers[index] || ''}
                                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                                        placeholder="Type your answer here"
                                        className={`text-lg ${showResults ? (isCorrect ? 'border-green-500' : isWrong ? 'border-red-500' : '') : ''}`}
                                        disabled={showResults}
                                    />
                                )}
                                {showResults && (
                                    <div className="mt-4 space-y-3">
                                        {isWrong && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                                                <p className="text-red-800 font-medium">Correct answer: <InlineTranslator sourceLanguage={exam.language}>{question.correct_answer}</InlineTranslator></p>
                                            </div>
                                        )}
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                            <p className="text-blue-800 font-medium">Explanation:</p>
                                            <p className="text-blue-700 text-sm mt-1"><InlineTranslator sourceLanguage={exam.language}>{String(question.explanation || 'No explanation available')}</InlineTranslator></p>
                                        </div>
                                        {question.text_reference && (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                                                <p className="text-amber-800 font-medium">Text reference:</p>
                                                <p className="text-amber-700 text-sm mt-1 italic">"<InlineTranslator sourceLanguage={exam.language}>{question.text_reference}</InlineTranslator>"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else { // Writing section
            const task = item;
            const feedbackResult = aiFeedback[index];

            return (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <Badge><InlineTranslator sourceLanguage={exam.language}>{task.task_type}</InlineTranslator></Badge>
                        </div>
                        <p className="font-semibold text-lg"><InlineTranslator sourceLanguage={exam.language}>{task.prompt}</InlineTranslator></p>
                        {task.word_count && (
                            <p className="text-sm text-blue-600 mt-2">
                                <strong>Word count:</strong> {task.word_count}
                            </p>
                        )}
                        {task.time_limit && (
                            <p className="text-sm text-blue-600 mt-1">
                                <strong>Time limit:</strong> {task.time_limit}
                            </p>
                        )}
                    </div>

                    {task.sample_answer && (
                        <details className="bg-gray-50 p-4 rounded-lg">
                            <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                                Show example answer
                            </summary>
                            <div className="mt-3 text-gray-800 text-sm">
                               <ReactMarkdown>{String(task.sample_answer || '')}</ReactMarkdown>
                                {task.comments && (
                                    <p className="text-xs text-gray-600 mt-2">
                                        <strong>Assessment:</strong> <InlineTranslator sourceLanguage={exam.language}>{task.comments}</InlineTranslator>
                                    </p>
                                )}
                            </div>
                        </details>
                    )}

                    <Textarea
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        placeholder={`Write your response here... (Target: ${task.word_count || 'check prompt guidelines'})`}
                        className="min-h-32 text-base"
                        rows={6}
                        disabled={isGrading || showResults}
                    />
                    {section.id === 'writing' && (
                        <div className="text-sm text-gray-500">
                            Words: {(answers[index] || '').split(' ').filter(word => word.length > 0).length}
                        </div>
                    )}

                    {isGrading && (
                        <div className="flex items-center justify-center gap-2 text-gray-600 p-4 bg-gray-100 rounded-lg">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Assessing your response with AI...</span>
                        </div>
                    )}

                    {showResults && !isGrading && (
                        <div className="mt-4 space-y-4">
                            {feedbackResult && feedbackResult.feedback ? (
                                <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Sparkles className="w-5 h-5 text-purple-600" />
                                            AI Feedback (Total Score: {feedbackResult.total_score}/32 - CEFR: {feedbackResult.cefr_level})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {feedbackResult.scores && (
                                            <div className="mb-4">
                                                <p className="font-semibold text-sm mb-2">Detailed Scores (1-8 scale):</p>
                                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                                    <p>Task Fulfillment: <span className="font-medium">{feedbackResult.scores.communicative_ability}</span></p>
                                                    <p>Coherence & Fluency: <span className="font-medium">{feedbackResult.scores.coherence}</span></p>
                                                    <p>Vocabulary: <span className="font-medium">{feedbackResult.scores.vocabulary}</span></p>
                                                    <p>Grammar: <span className="font-medium">{feedbackResult.scores.grammar}</span></p>
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2 text-gray-800">
                                            <p><span className="font-semibold">Strengths:</span> <InlineTranslator sourceLanguage={exam.language}>{feedbackResult.feedback.strengths}</InlineTranslator></p>
                                            <p><span className="font-semibold">Weaknesses:</span> <InlineTranslator sourceLanguage={exam.language}>{feedbackResult.feedback.weaknesses}</InlineTranslator></p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                showResults && !isGrading && (
                                    <p className="text-red-600">Could not retrieve detailed AI feedback for this response.</p>
                                )
                            )}
                        </div>
                    )}
                </div>
            );
        }
    };

    const totalQuestions = items.length;

    // Custom progress calculation for reading/writing
    const answeredQuestionsCount = Object.keys(answers).filter(key => answers[key] !== '').length;
    const progress = section.id === 'listening'
        ? (answeredQuestionsCount / totalQuestions) * 100
        : totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

    const isLastQuestion = currentQuestion === totalQuestions - 1;

    const QuestionCardContent = (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <Badge variant="secondary" className="mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Quick Practice
                        </Badge>
                        <CardTitle className="text-2xl font-bold">
                            {section.id === 'writing' ? 'Task' : 'Question'} {currentQuestion + 1} of {items.length}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-2">
                            {exam.language === 'finnish' ? 'Finnish' : 'Swedish'} - {exam.difficulty}
                        </Badge>
                    </div>
                </div>
                <Progress value={progress} className="mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
                {renderQuestion(items[currentQuestion], currentQuestion)}
                <div className="flex justify-between items-center pt-6">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0 || isGrading || isSubmitting}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onCancel} disabled={isGrading || isSubmitting}>
                            Exit Practice
                        </Button>
                        {showResults ? (
                            isLastQuestion ? (
                                <Button
                                    onClick={handleSubmit} // This will trigger the final grading and summary for writing
                                    disabled={isSubmitting || isGrading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Continue to Summary
                                </Button>
                            ) : (
                                <Button onClick={handleNext} disabled={isGrading || isSubmitting}>
                                    Next
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )
                        ) : (
                            // If results are not shown, 'Submit' or 'Next' button
                            isLastQuestion ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isGrading || !answers[currentQuestion]}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {isSubmitting || isGrading ? 'Processing...' : 'Submit & View Results'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isGrading || !answers[currentQuestion]}
                                >
                                    {section.id === 'writing' ? 'Assess & Next' : 'Submit & Next'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="max-w-7xl mx-auto p-4">
            {section.id === 'reading' && examContent.text ? (
                <div className="flex flex-col gap-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Badge variant="outline">{exam.difficulty}</Badge>
                                    Read the text
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <InlineTranslator sourceLanguage={exam.language}>
                                <div className="prose max-w-none text-lg leading-relaxed text-gray-700">
                                    {examContent.text.split('\n').map((paragraph, index) => (
                                        <p key={index}>{paragraph}</p>
                                    ))}
                                </div>
                            </InlineTranslator>
                        </CardContent>
                    </Card>
                    {QuestionCardContent}
                </div>
            ) : section.id === 'listening' && examContent.audio_script ? (
                <div className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                        Listening Comprehension
                                    </CardTitle>
                                    <Badge variant="secondary" className="mt-2">
                                        {exam.language === 'finnish' ? 'Finnish' : 'Swedish'} - {exam.difficulty}
                                    </Badge>
                                </div>
                                <Button variant="outline" onClick={onCancel}>Exit Practice</Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-blue-50 rounded-lg mb-6">
                                <h3 className="font-semibold mb-2">Listening Scenario:</h3>
                                <p className="text-sm text-gray-600 mb-3"><InlineTranslator sourceLanguage={exam.language}>{examContent.scenario_description}</InlineTranslator></p>
                                <div className="flex items-center gap-4">
                                    <AudioPlayer
                                        audioBase64={examContent.audio_base64}
                                        dialogueSegments={examContent.dialogue_segments}
                                        isDialogue={examContent.scenario_description?.toLowerCase().includes('dialogue')}
                                        className="text-lg"
                                    />
                                    <span className="text-sm text-gray-500">
                                        {examContent.scenario_description?.toLowerCase().includes('dialogue') ?
                                            "Click to hear the dialogue with different voices" :
                                            "Click to hear the audio"
                                        }
                                    </span>
                                </div>
                                <details className="mt-3 bg-white p-3 rounded border">
                                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                        Show transcript (click to expand)
                                    </summary>
                                    <p className="font-mono text-sm italic text-gray-600 mt-2"><InlineTranslator sourceLanguage={exam.language}>{examContent.audio_script}</InlineTranslator></p>
                                </details>
                            </div>

                            <h3 className="text-lg font-bold mb-4">Questions</h3>
                            <Progress value={progress} className="mb-6 h-2" />
                            <div className="space-y-0 bg-gray-50 p-2 rounded-lg max-h-[60vh] overflow-y-auto">
                                {examContent.questions.map((question, index) => renderQuestion(question, index))}
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || answeredQuestionsCount < totalQuestions}
                                    className="bg-green-600 hover:bg-green-700"
                                    size="lg"
                                >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    {isSubmitting ? 'Submitting...' : 'Submit & View Results'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : section.id === 'speaking' ? ( // NEW BRANCH for speaking
                <div className="space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <Badge variant="secondary" className="mb-2 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        Quick Practice
                                    </Badge>
                                    <CardTitle className="text-2xl font-bold">
                                        Speaking Tasks
                                    </CardTitle>
                                    <Badge variant="secondary" className="mt-2">
                                        {exam.language === 'finnish' ? 'Finnish' : 'Swedish'} - {exam.difficulty}
                                    </Badge>
                                </div>
                            </div>
                            <Progress value={
                                (Object.keys(answers).length / items.length) * 100
                            } className="mt-4" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {items.map((task, index) => (
                                <SpeakingTask
                                    key={index}
                                    task={task}
                                    taskIndex={index}
                                    onAnswerSubmit={handleSpeakingAnswer}
                                    isSubmitting={isGrading} // Use parent's isGrading for overall submission control
                                    language={exam.language}
                                    difficulty={exam.difficulty}
                                />
                            ))}
                            <div className="flex justify-end pt-6">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isGrading || Object.keys(answers).length !== items.length}
                                    className="bg-green-600 hover:bg-green-700"
                                    size="lg"
                                >
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    {isSubmitting || isGrading ? 'Grading All...' : 'Submit All & Get Feedback'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-6">
                    {QuestionCardContent}
                </div>
            )}
        </div>
    );
}