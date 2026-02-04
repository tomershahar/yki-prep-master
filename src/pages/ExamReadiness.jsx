import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Target, TrendingUp, Calendar, BookOpen, 
    Loader2, RefreshCw, CheckCircle, AlertCircle,
    ArrowRight, Sparkles
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function ExamReadiness() {
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [readinessScore, setReadinessScore] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadReadinessData();
    }, []);

    const loadReadinessData = async () => {
        try {
            setLoading(true);
            setError(null);

            const currentUser = await base44.auth.me();
            setUser(currentUser);

            // Load readiness score
            const scores = await base44.entities.ReadinessScore.filter({
                user_email: currentUser.email
            }, '-last_calculated', 1);

            if (scores.length > 0) {
                setReadinessScore(scores[0]);

                // Check if analysis is stale (>24 hours)
                const analyses = await base44.entities.ReadinessAnalysis.filter({
                    user_email: currentUser.email,
                    readiness_score_id: scores[0].id
                }, '-analysis_date', 1);

                if (analyses.length > 0) {
                    const analysisAge = Date.now() - new Date(analyses[0].analysis_date).getTime();
                    const isStale = analysisAge > 24 * 60 * 60 * 1000;

                    if (isStale) {
                        await generateAnalysis(scores[0]);
                    } else {
                        setAnalysis(analyses[0]);
                    }
                } else {
                    await generateAnalysis(scores[0]);
                }
            } else {
                setError('No readiness data available. Complete at least 5 practice sessions to get started.');
            }
        } catch (err) {
            console.error('Error loading readiness:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateAnalysis = async (score) => {
        try {
            setAnalyzing(true);

            // Get recent practice sessions
            const sessions = await base44.entities.PracticeSession.filter({
                created_by: user.email
            }, '-created_date', 20);

            // Calculate practice frequency
            const practiceFrequency = calculatePracticeFrequency(sessions);

            // Prepare agent context
            const agentContext = `
User Readiness Data:
- Current Score: ${score.score}% (${score.level})
- Section Scores: Reading ${score.section_scores.reading}%, Listening ${score.section_scores.listening}%, Writing ${score.section_scores.writing}%, Speaking ${score.section_scores.speaking}%
- Target Level: ${score.target_level}
- Total Practice Sessions: ${sessions.length}
- Practice Frequency: ${practiceFrequency}
${user.exam_date ? `- Exam Date: ${user.exam_date}` : ''}

Provide personalized analysis and recommendations in JSON format.
            `.trim();

            // Create conversation with agent
            const conversation = await base44.agents.createConversation({
                agent_name: 'examReadinessAnalyzer',
                metadata: {
                    user_email: user.email,
                    readiness_score_id: score.id
                }
            });

            // Send message to agent
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: agentContext
            });

            // Wait for agent response
            let agentResponse = null;
            const maxWaitTime = 10000; // 10 seconds
            const startTime = Date.now();

            await new Promise((resolve) => {
                const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
                    const lastMessage = data.messages[data.messages.length - 1];
                    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content) {
                        agentResponse = lastMessage.content;
                        unsubscribe();
                        resolve();
                    }

                    if (Date.now() - startTime > maxWaitTime) {
                        unsubscribe();
                        resolve();
                    }
                });
            });

            if (!agentResponse) {
                throw new Error('Agent did not respond in time');
            }

            // Parse agent response
            const parsedResponse = JSON.parse(agentResponse);

            // Save analysis
            const savedAnalysis = await base44.entities.ReadinessAnalysis.create({
                user_email: user.email,
                readiness_score_id: score.id,
                level_assessment: parsedResponse.level_assessment,
                recommendations: parsedResponse.recommendations,
                next_milestone: parsedResponse.next_milestone,
                timeline_assessment: parsedResponse.timeline_assessment || null,
                motivational_message: parsedResponse.motivational_message,
                analysis_date: new Date().toISOString(),
                is_stale: false
            });

            setAnalysis(savedAnalysis);
        } catch (err) {
            console.error('Error generating analysis:', err);
            setError('Failed to generate AI analysis. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const calculatePracticeFrequency = (sessions) => {
        if (sessions.length === 0) return '0 sessions/week';
        
        const oldestSession = new Date(sessions[sessions.length - 1].created_date);
        const weeksSinceFisrt = Math.max(1, Math.ceil((Date.now() - oldestSession.getTime()) / (7 * 24 * 60 * 60 * 1000)));
        const frequency = (sessions.length / weeksSinceFisrt).toFixed(1);
        
        return `${frequency} sessions/week`;
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'YKI Ready': return 'bg-green-100 text-green-800 border-green-300';
            case 'YKI Candidate': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'YKI Learner': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getProgressColor = (score) => {
        if (score >= 86) return 'bg-green-600';
        if (score >= 66) return 'bg-purple-600';
        if (score >= 41) return 'bg-blue-600';
        return 'bg-gray-600';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error && !readinessScore) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="mt-6">
                    <Link to={createPageUrl('Practice')}>
                        <Button>Start Practicing</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">YKI Exam Readiness</h1>
                    <p className="text-gray-600 mt-1">Your personalized preparation progress</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={() => generateAnalysis(readinessScore)}
                    disabled={analyzing}
                >
                    {analyzing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh Analysis
                        </>
                    )}
                </Button>
            </div>

            {/* Current Level Card */}
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Target className="w-8 h-8 text-blue-600" />
                            <div>
                                <CardTitle className="text-2xl">Current Readiness Level</CardTitle>
                                <CardDescription>Based on your practice history</CardDescription>
                            </div>
                        </div>
                        <Badge className={`${getLevelColor(readinessScore?.level)} text-lg px-4 py-2 border`}>
                            {readinessScore?.level}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl font-bold">{readinessScore?.score}%</span>
                            <span className="text-sm text-gray-500">Target: {readinessScore?.target_level} Level</span>
                        </div>
                        <Progress 
                            value={readinessScore?.score} 
                            className="h-3"
                            style={{ '--progress-background': getProgressColor(readinessScore?.score) }}
                        />
                    </div>

                    {/* Section Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                        {['reading', 'listening', 'writing', 'speaking'].map(section => (
                            <div key={section} className="text-center">
                                <div className="text-sm text-gray-600 capitalize mb-1">{section}</div>
                                <div className="text-2xl font-bold">
                                    {readinessScore?.section_scores?.[section] || 0}%
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Analysis Section */}
            {analyzing ? (
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Generating personalized analysis...</p>
                        </div>
                    </CardContent>
                </Card>
            ) : analysis ? (
                <>
                    {/* Level Assessment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Your Level Assessment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 leading-relaxed">{analysis.level_assessment}</p>
                            {analysis.motivational_message && (
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-blue-900 font-medium">{analysis.motivational_message}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Personalized Recommendations
                            </CardTitle>
                            <CardDescription>Prioritized actions to improve your readiness</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {analysis.recommendations?.map((rec, index) => (
                                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">Priority {rec.priority}</Badge>
                                            <Badge className="capitalize">{rec.practice_type}</Badge>
                                            <Badge variant="secondary">{rec.difficulty}</Badge>
                                        </div>
                                    </div>
                                    <h4 className="font-semibold text-lg mb-2">{rec.action}</h4>
                                    <p className="text-gray-700 mb-2">{rec.reason}</p>
                                    <p className="text-sm text-gray-600">
                                        <strong>Focus on:</strong> {rec.specific_focus}
                                    </p>
                                    <Link to={createPageUrl('Practice')}>
                                        <Button variant="outline" size="sm" className="mt-3">
                                            Start Practice <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Next Milestone */}
                    {analysis.next_milestone && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                    Next Milestone
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <span className="font-semibold">Target: </span>
                                        <Badge className="ml-2">{analysis.next_milestone.target_level}</Badge>
                                    </div>
                                    <p className="text-gray-700">{analysis.next_milestone.criteria}</p>
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                        <div>
                                            <div className="text-sm text-gray-600">Estimated Sessions</div>
                                            <div className="text-2xl font-bold">{analysis.next_milestone.estimated_sessions}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Estimated Weeks</div>
                                            <div className="text-2xl font-bold">{analysis.next_milestone.estimated_weeks}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Timeline Assessment */}
                    {analysis.timeline_assessment && (
                        <Alert>
                            <Calendar className="w-4 h-4" />
                            <AlertDescription>{analysis.timeline_assessment}</AlertDescription>
                        </Alert>
                    )}
                </>
            ) : null}
        </div>
    );
}