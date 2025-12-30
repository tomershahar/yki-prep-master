
import React, { useState, useEffect } from 'react';
import { Feedback } from '@/entities/Feedback';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Megaphone, CheckCircle, Sparkles, Zap, Bug } from 'lucide-react';

export default function ChangelogPage() {
    const [resolvedFeedback, setResolvedFeedback] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadResolvedFeedback();
    }, []);

    const loadResolvedFeedback = async () => {
        setIsLoading(true);
        try {
            const feedbackItems = await Feedback.filter({ status: 'resolved' }, '-updated_date');
            setResolvedFeedback(feedbackItems);
        } catch (error) {
            console.error("Error loading changelog:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Recent improvements from the last 2 weeks
    const recentImprovements = [
        {
            date: 'August 15, 2025',
            type: 'fix',
            title: 'Fixed Critical Word Bank Saving Issue',
            description: 'Resolved a major permissions bug that prevented users from saving words to their Word Bank. Users can now successfully save words from reading passages and practice sessions. All previously failed save attempts should now work correctly.',
            icon: Bug
        },
        {
            date: 'August 14, 2025',
            type: 'improvement',
            title: 'Enhanced Writing Feedback with Actionable Focus Areas',
            description: 'Writing task feedback now includes specific, actionable focus areas to help you improve. Instead of just pointing out mistakes, the AI now suggests what to study next (e.g., "Review past tense conjugations" or "Practice using conjunctions to connect ideas").',
            icon: Sparkles
        },
        {
            date: 'August 14, 2025',
            type: 'fix',
            title: 'Fixed Critical Answer Scoring Bug',
            description: 'Resolved a major issue where correct multiple-choice answers were incorrectly marked as wrong, even when the user selected the right option. The scoring logic now properly handles both letter-based and text-based correct answers from the AI.',
            icon: Bug
        },
        {
            date: 'August 14, 2025',
            type: 'fix',
            title: 'Fixed Finnish B1 Reading Exam Loading Error',
            description: 'Resolved an issue where Finnish B1 reading exams would fail to load due to corrupted pre-generated content in the exam pool. The system now validates exam content before use and generates fresh content if needed.',
            icon: Bug
        },
        {
            date: 'August 9, 2025',
            type: 'fix',
            title: 'Improved Answer Validation Accuracy',
            description: 'Fixed a bug that incorrectly marked correct answers as wrong due to minor punctuation differences (e.g., a missing period at the end of a sentence). The scoring is now more accurate and fair.',
            icon: Bug
        },
        {
            date: 'August 9, 2025',
            type: 'fix',
            title: 'Fixed Full Exam Loading Errors',
            description: "Resolved an issue where users would sometimes see a 'Content Generation Error' when starting a full exam, even when the content was ready. The exam content now loads reliably after being generated.",
            icon: Bug
        },
        {
            date: 'August 8, 2025',
            type: 'improvement',
            title: 'Enhanced Speaking Practice Reliability',
            description: 'Overhauled the speaking practice module to fix grading timeouts and improve the accuracy and speed of AI feedback. The transcription and evaluation process is now much more robust.',
            icon: Zap
        },
        {
            date: 'August 7, 2025',
            type: 'fix',
            title: 'Resolved Listening Practice Audio Issues',
            description: 'Fixed a bug that could cause audio generation to fail in listening exercises, ensuring a smoother practice experience.',
            icon: Bug
        },
        {
            date: 'August 6, 2025',
            type: 'feature',
            title: 'Introducing the Word Bank & Flashcards',
            description: 'You can now save new words you encounter during practice to your personal Word Bank. Review your saved words and study them using the new interactive flashcards mode.',
            icon: Sparkles
        },
        {
            date: 'August 5, 2025',
            type: 'feature',
            title: 'Added Inline Word Translation',
            description: 'Users can now select any word in reading passages to get instant translations, making practice more accessible.',
            icon: Sparkles
        },
        {
            date: 'August 4, 2025',
            type: 'fix',
            title: 'Fixed Answer Validation Issues',
            description: 'Resolved issues where correct answers were marked as wrong due to formatting differences like smart quotes and extra spaces.',
            icon: Bug
        },
        {
            date: 'August 3, 2025',
            type: 'feature',
            title: 'Enhanced Error Handling for New Users',
            description: 'Improved the beta disclaimer process to handle Microsoft and Google account login issues more gracefully.',
            icon: Zap
        },
        {
            date: 'August 2, 2025',
            type: 'improvement',
            title: 'Better Audio Generation',
            description: 'Listening exercises now use more natural-sounding AI voices with proper pronunciation for Finnish and Swedish.',
            icon: CheckCircle
        },
        {
            date: 'July 30, 2025',
            type: 'improvement',
            title: 'Streamlined Navigation',
            description: 'Removed empty Study Materials section from user navigation to reduce confusion.',
            icon: CheckCircle
        },
        {
            date: 'July 29, 2025',
            type: 'feature',
            title: 'Enhanced Practice Feedback',
            description: 'Added detailed explanations for why answers are correct or incorrect to help with learning.',
            icon: Sparkles
        },
        {
            date: 'July 28, 2025',
            type: 'fix',
            title: 'Improved Speaking Practice',
            description: 'Fixed microphone detection issues and added browser compatibility warnings for better recording experience.',
            icon: Bug
        }
    ];

    const getTypeConfig = (type) => {
        switch (type) {
            case 'feature':
                return { color: 'bg-green-100 text-green-800', label: 'New Feature' };
            case 'fix':
                return { color: 'bg-red-100 text-red-800', label: 'Bug Fix' };
            case 'improvement':
                return { color: 'bg-blue-100 text-blue-800', label: 'Improvement' };
            default:
                return { color: 'bg-gray-100 text-gray-800', label: 'Update' };
        }
    };

    const groupFeedbackByDate = (feedbackItems) => {
        return feedbackItems.reduce((acc, item) => {
            const date = new Date(item.updated_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {});
    };

    const groupedFeedback = groupFeedbackByDate(resolvedFeedback);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2">Loading Changelog...</span>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl">
                    <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Changelog & Updates</h1>
                    <p className="text-gray-600">Here's what's new and improved in YKI Prep Master!</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Recent Improvements Section */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-500" />
                        Recent Improvements
                    </h2>
                    <div className="space-y-4">
                        {recentImprovements.map((improvement, index) => {
                            const typeConfig = getTypeConfig(improvement.type);
                            const Icon = improvement.icon;
                            return (
                                <Card key={index} className="border-l-4 border-green-500">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <Icon className="w-6 h-6 text-green-500 mt-1" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-gray-800">{improvement.title}</h3>
                                                    <Badge className={typeConfig.color}>
                                                        {typeConfig.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-gray-600 mb-2">{improvement.description}</p>
                                                <p className="text-xs text-gray-500">{improvement.date}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* User Feedback Based Improvements */}
                {Object.keys(groupedFeedback).length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            Based on Your Feedback
                        </h2>
                        {Object.entries(groupedFeedback).map(([date, items]) => (
                            <div key={date} className="mb-6">
                                <h3 className="text-lg font-medium text-gray-600 mb-3">{date}</h3>
                                <div className="space-y-4">
                                    {items.map(item => (
                                        <Card key={item.id} className="border-l-4 border-blue-500">
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <CheckCircle className="w-6 h-6 text-blue-500 mt-1" />
                                                    <div>
                                                        <p className="font-medium text-gray-800">Feedback Implemented:</p>
                                                        <blockquote className="text-gray-600 italic border-l-2 border-gray-200 pl-4 my-2">
                                                            "{item.feedback_text}"
                                                        </blockquote>
                                                        <p className="text-xs text-gray-500">
                                                            Submitted by a user on page: {item.page_context}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Have suggestions?</h3>
                        <p className="text-gray-600 mb-4">
                            Your feedback helps us improve YKI Prep Master. Use the feedback button to share your thoughts!
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

