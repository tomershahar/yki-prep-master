import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ReadinessWidget({ user }) {
    const [readiness, setReadiness] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadReadiness();
        }
    }, [user]);

    const loadReadiness = async () => {
        try {
            const scores = await base44.entities.ReadinessScore.filter({
                user_email: user.email
            }, '-last_calculated', 1);

            if (scores.length > 0) {
                setReadiness(scores[0]);
            }
        } catch (error) {
            console.error('Error loading readiness:', error);
        } finally {
            setLoading(false);
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'YKI Ready': return 'bg-green-100 text-green-800 border-green-300';
            case 'YKI Candidate': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'YKI Learner': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getLevelMessage = (level, score) => {
        switch (level) {
            case 'YKI Ready':
                return 'You\'re exam ready! Keep practicing to maintain your skills.';
            case 'YKI Candidate':
                return `You're close! Just ${86 - score}% away from being fully ready.`;
            case 'YKI Learner':
                return 'Great progress! Keep building your skills consistently.';
            default:
                return 'Start your journey! Complete practice sessions to track progress.';
        }
    };

    if (loading) {
        return (
            <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </CardContent>
            </Card>
        );
    }

    if (!readiness || !readiness.sufficient_data) {
        return (
            <Card className="hover:shadow-lg transition-shadow border-2 border-blue-200">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">Track Your Exam Readiness</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Complete 5-10 practice sessions to unlock your personalized readiness assessment.
                            </p>
                            <Link to={createPageUrl('Practice')}>
                                <Button size="sm" variant="outline">
                                    Start Practicing <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Link to={createPageUrl('ExamReadiness')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-lg">Exam Readiness</h3>
                                <Badge className={`${getLevelColor(readiness.level)} border font-semibold`}>
                                    {readiness.level}
                                </Badge>
                            </div>
                            <div className="flex items-baseline gap-2 mb-2">
                                <span className="text-3xl font-bold">{readiness.score}%</span>
                                <span className="text-sm text-gray-500">ready</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                                {getLevelMessage(readiness.level, readiness.score)}
                            </p>
                            <div className="flex items-center text-blue-600 text-sm font-medium">
                                View Full Analysis <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}