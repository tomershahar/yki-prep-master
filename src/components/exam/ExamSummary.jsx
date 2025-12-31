import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Award, RefreshCw, LogOut, AlertTriangle } from "lucide-react";
import InlineTranslator from '../shared/InlineTranslator';
import YKIScoreBadge from './YKIScoreBadge';

export default function ExamSummary({ section, examContent, answers, scoreData, aiFeedback, onRestart, onExit, isStaticPractice }) {

    const normalizeString = (str) => {
        if (typeof str !== 'string') return '';
        return str.trim().replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').toLowerCase();
    };

    const renderReadingListeningSummary = () => (
        <div className="space-y-6">
            {(examContent?.questions || []).map((question, index) => {
                const userAnswer = answers?.[index] || 'No answer submitted.';
                const isCorrect = normalizeString(userAnswer) === normalizeString(question.correct_answer);
                return (
                    <Card key={index} className={`bg-white/70 ${isCorrect ? 'border-green-300' : 'border-red-300'}`}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg flex-1">
                                    {index + 1}. <InlineTranslator sourceLanguage={examContent.language}>{question.question}</InlineTranslator>
                                </CardTitle>
                                {isCorrect ? (
                                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                ) : (
                                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p><strong>Your answer:</strong> <span className={isCorrect ? 'text-green-700' : 'text-red-700'}>{userAnswer}</span></p>
                            {!isCorrect && <p><strong>Correct answer:</strong> <span className="text-green-700">{question.correct_answer}</span></p>}
                            <p className="text-sm text-gray-600"><strong>Explanation:</strong> <InlineTranslator sourceLanguage={examContent.language}>{question.explanation}</InlineTranslator></p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    const renderWritingSpeakingSummary = () => (
        <div className="space-y-6">
            {(examContent?.tasks || []).map((task, index) => {
                const userAnswer = answers?.[index]?.answer || answers?.[index] || 'No answer submitted.';
                const feedback = aiFeedback?.[index];

                return (
                    <Card key={index} className="bg-white/70">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                <InlineTranslator sourceLanguage={examContent?.language}>{task.task_type}</InlineTranslator>
                            </CardTitle>
                            <CardDescription>
                                <InlineTranslator sourceLanguage={examContent?.language}>{task.prompt}</InlineTranslator>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-semibold text-gray-700">Your Answer:</p>
                                    <div className="p-3 bg-gray-50 rounded-md mt-1 text-gray-800 whitespace-pre-wrap">
                                      <InlineTranslator sourceLanguage={examContent?.language}>{userAnswer}</InlineTranslator>
                                    </div>
                                </div>
                                {feedback ? (
                                    <div>
                                        <p className="font-semibold text-gray-700">AI Feedback:</p>
                                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-1 space-y-2">
                                            <p><strong>Strengths:</strong> {feedback.feedback?.strengths || 'Not available.'}</p>
                                            <p><strong>Weaknesses:</strong> {feedback.feedback?.weaknesses || 'Not available.'}</p>
                                            <p><strong>Estimated Level:</strong> {feedback.cefr_level || 'N/A'}</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2">
                                                <p>Communicative Ability: <Badge variant="secondary">{feedback.scores?.communicative_ability ?? 'N/A'}</Badge></p>
                                                <p>Coherence: <Badge variant="secondary">{feedback.scores?.coherence ?? 'N/A'}</Badge></p>
                                                <p>Vocabulary: <Badge variant="secondary">{feedback.scores?.vocabulary ?? 'N/A'}</Badge></p>
                                                <p>Grammar: <Badge variant="secondary">{feedback.scores?.grammar ?? 'N/A'}</Badge></p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                   <p className="text-gray-500">AI feedback is not available for this task.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );

    const renderScoreSection = () => {
        // IMPROVED: Handle grading failures
        if (scoreData.gradingFailed) {
            return (
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-md">
                    <CardHeader className="text-center">
                        <AlertTriangle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                        <CardTitle className="text-2xl text-yellow-800">Practice Saved (Not Graded)</CardTitle>
                        <CardDescription className="text-yellow-700">
                            Your response was saved but could not be evaluated due to a technical issue.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-yellow-700 mb-4">
                            This practice session won't count toward your progress, but you can try again anytime.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Button onClick={() => onRestart()}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Try Again
                            </Button>
                            <Button onClick={() => onExit(false)} variant="outline">
                                <LogOut className="w-4 h-4 mr-2" />
                                Back to Practice
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const scoreColor = scoreData?.score >= 75 ? 'text-green-600' : scoreData?.score >= 50 ? 'text-amber-600' : 'text-red-600';
        const scoreMessage = scoreData?.score >= 75 ? 'Great job!' : scoreData?.score >= 50 ? 'Good effort!' : 'Keep practicing!';

        return (
            <div className="text-center mb-8 space-y-4">
                <div className="flex justify-center">
                    <YKIScoreBadge score={scoreData?.score ?? 0} showDetails={true} />
                </div>
                <p className="text-lg font-medium text-gray-700">{scoreMessage}</p>
                {section.id !== 'writing' && section.id !== 'speaking' && (
                    <p className="text-gray-500 mt-1">{scoreData?.correct ?? 0} out of {scoreData?.total ?? 0} correct</p>
                )}
                <p className="text-sm text-gray-500">Raw score: {scoreData?.score ?? 0}%</p>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 bg-gray-50 rounded-lg shadow-inner">
            <Card className="border-0 shadow-xl">
                <CardHeader className="text-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-t-lg">
                    <Award className="w-16 h-16 mx-auto mb-4 text-amber-300" />
                    <CardTitle className="text-3xl font-bold">Practice Complete!</CardTitle>
                    <CardDescription className="text-blue-100 text-lg">{section.title}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                    {renderScoreSection()}
                    
                    <div className="my-8">
                        <h3 className="text-xl font-bold text-center mb-4 text-gray-800">Detailed Review</h3>
                        {section.id === 'reading' || section.id === 'listening' ? renderReadingListeningSummary() : renderWritingSpeakingSummary()}
                    </div>

                    {!scoreData.gradingFailed && ( // Only show action buttons if grading was successful
                        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                            <Button variant="outline" onClick={onRestart}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Practice Again
                            </Button>
                            <Button onClick={() => onExit(scoreData?.score >= 75)} className="bg-green-600 hover:bg-green-700">
                                <LogOut className="w-4 h-4 mr-2" />
                                Finish & Save
                            </Button>
                        </div>
                    )}
                    {isStaticPractice && scoreData?.score < 75 && !scoreData.gradingFailed && (
                         <div className="text-center mt-4">
                             <Button variant="ghost" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => onExit(true)}>
                                Mark as completed anyway and don't show again
                             </Button>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}