import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Brain, Sparkles, Loader2, X } from 'lucide-react';
import { getAdaptiveLearningRecommendations } from '@/functions/getAdaptiveLearningRecommendations';
import { proactiveCoachCheck } from '@/functions/proactiveCoachCheck';
import { AgentRecommendation } from '@/entities/AgentRecommendation';

export default function AgentRecommendations() {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadRecommendations();
    }, []);

    const loadRecommendations = async () => {
        setIsLoading(true);
        try {
            const recs = await AgentRecommendation.filter(
                { is_active: true },
                '-priority,-created_date',
                10
            );
            setRecommendations(recs);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateRecommendations = async () => {
        setIsGenerating(true);
        try {
            // Generate both types of recommendations
            await Promise.all([
                getAdaptiveLearningRecommendations(),
                proactiveCoachCheck()
            ]);
            await loadRecommendations();
        } catch (error) {
            console.error('Failed to generate recommendations:', error);
            alert('Failed to generate recommendations. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const dismissRecommendation = async (id) => {
        try {
            await AgentRecommendation.update(id, { is_active: false });
            setRecommendations(recommendations.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to dismiss recommendation:', error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Loading AI recommendations...</span>
                </CardContent>
            </Card>
        );
    }

    if (recommendations.length === 0) {
        return (
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-500 rounded-full">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Get AI-Powered Recommendations</h3>
                                <p className="text-sm text-gray-600">Let our AI agents analyze your progress and provide personalized guidance</p>
                            </div>
                        </div>
                        <Button 
                            onClick={generateRecommendations}
                            disabled={isGenerating}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate Recommendations
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {recommendations.map((rec) => {
                const isLearning = rec.agent_type === 'adaptive_learning';
                const bgColor = isLearning 
                    ? 'from-blue-50 to-indigo-50 border-blue-200' 
                    : 'from-green-50 to-emerald-50 border-green-200';
                const iconBg = isLearning ? 'bg-blue-500' : 'bg-green-500';
                const Icon = isLearning ? Brain : Sparkles;

                return (
                    <Card key={rec.id} className={`bg-gradient-to-br ${bgColor}`}>
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`p-3 ${iconBg} rounded-full flex-shrink-0`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-gray-900">{rec.title}</h3>
                                            <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                                                {isLearning ? '🎯 Learning Coach' : '💪 Study Coach'}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 mb-4">{rec.message}</p>
                                        <Link to={createPageUrl(rec.action_url)}>
                                            <Button className={isLearning ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}>
                                                {rec.action_text}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => dismissRecommendation(rec.id)}
                                    className="flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            
            <div className="flex justify-center">
                <Button 
                    variant="outline" 
                    onClick={generateRecommendations}
                    disabled={isGenerating}
                    className="w-full md:w-auto"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Refresh Recommendations
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}