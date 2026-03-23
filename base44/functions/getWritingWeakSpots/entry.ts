import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's recent writing practice sessions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const writingSessions = await base44.entities.PracticeSession.filter({
            created_by: user.email,
            exam_section: 'writing',
            created_date: { "$gte": thirtyDaysAgo.toISOString() }
        }, '-created_date', 20);

        if (!writingSessions || writingSessions.length === 0) {
            return Response.json({
                weakSpots: [],
                message: 'No previous writing sessions found'
            });
        }

        // Analyze detailed feedback to identify recurring issues
        const errorCounts = {
            grammar: 0,
            vocabulary: 0,
            coherence: 0,
            task_fulfillment: 0
        };

        const specificIssues = [];
        let totalSessions = 0;

        writingSessions.forEach(session => {
            if (!session.detailed_feedback) return;
            
            totalSessions++;

            // Analyze scores from detailed feedback
            Object.values(session.detailed_feedback).forEach(taskFeedback => {
                if (!taskFeedback.scores) return;

                // Count low scores (below 5 out of 8) as weak spots
                if (taskFeedback.scores.grammar < 5) {
                    errorCounts.grammar++;
                }
                if (taskFeedback.scores.vocabulary < 5) {
                    errorCounts.vocabulary++;
                }
                if (taskFeedback.scores.coherence < 5) {
                    errorCounts.coherence++;
                }
                if (taskFeedback.scores.communicative_ability < 5) {
                    errorCounts.task_fulfillment++;
                }

                // Extract specific weaknesses from feedback text
                if (taskFeedback.feedback && taskFeedback.feedback.weaknesses) {
                    const weaknessText = taskFeedback.feedback.weaknesses.toLowerCase();
                    
                    // Look for specific grammar issues
                    if (weaknessText.includes('tense') || weaknessText.includes('past') || weaknessText.includes('present')) {
                        specificIssues.push('verb tense usage');
                    }
                    if (weaknessText.includes('article') || weaknessText.includes('a/an/the')) {
                        specificIssues.push('article usage');
                    }
                    if (weaknessText.includes('plural') || weaknessText.includes('singular')) {
                        specificIssues.push('singular/plural forms');
                    }
                    if (weaknessText.includes('preposition')) {
                        specificIssues.push('preposition usage');
                    }
                    if (weaknessText.includes('connector') || weaknessText.includes('linking word')) {
                        specificIssues.push('linking words and connectors');
                    }
                    if (weaknessText.includes('sentence structure') || weaknessText.includes('complex sentence')) {
                        specificIssues.push('sentence structure variety');
                    }
                    if (weaknessText.includes('vocabulary') || weaknessText.includes('word choice')) {
                        specificIssues.push('vocabulary range');
                    }
                }
            });
        });

        // Identify top weak spots (issues appearing in >30% of sessions)
        const threshold = Math.max(2, totalSessions * 0.3);
        const weakSpots = [];

        if (errorCounts.grammar >= threshold) {
            weakSpots.push({
                category: 'grammar',
                severity: 'high',
                occurrences: errorCounts.grammar,
                description: 'Grammatical accuracy needs improvement'
            });
        }
        if (errorCounts.vocabulary >= threshold) {
            weakSpots.push({
                category: 'vocabulary',
                severity: 'high',
                occurrences: errorCounts.vocabulary,
                description: 'Vocabulary range and word choice need work'
            });
        }
        if (errorCounts.coherence >= threshold) {
            weakSpots.push({
                category: 'coherence',
                severity: 'high',
                occurrences: errorCounts.coherence,
                description: 'Text organization and flow need improvement'
            });
        }
        if (errorCounts.task_fulfillment >= threshold) {
            weakSpots.push({
                category: 'task_fulfillment',
                severity: 'high',
                occurrences: errorCounts.task_fulfillment,
                description: 'Task completion and addressing all requirements need attention'
            });
        }

        // Add unique specific issues
        const uniqueIssues = [...new Set(specificIssues)];
        
        return Response.json({
            weakSpots,
            specificIssues: uniqueIssues.slice(0, 5), // Top 5 specific issues
            totalSessionsAnalyzed: totalSessions,
            message: weakSpots.length > 0 
                ? `Found ${weakSpots.length} areas needing improvement` 
                : 'Great work! No significant weak spots detected'
        });

    } catch (error) {
        console.error('Error analyzing weak spots:', error);
        return Response.json({ 
            error: 'Failed to analyze weak spots',
            details: error.message 
        }, { status: 500 });
    }
});