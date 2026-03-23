import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        // Get user visits
        const visits = await base44.entities.UserVisit.filter(
            { created_by: user.email },
            '-timestamp',
            30
        );

        // Get recent sessions
        const sessions = await base44.entities.PracticeSession.filter(
            { created_by: user.email },
            '-created_date',
            30
        );

        // Calculate days since last practice
        const now = new Date();
        const lastSession = sessions[0];
        const daysSinceLastPractice = lastSession 
            ? Math.floor((now - new Date(lastSession.created_date)) / (1000 * 60 * 60 * 24))
            : 999;

        // Calculate current streak
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const sessionDates = sessions
            .map(s => new Date(s.created_date).setHours(0, 0, 0, 0))
            .filter((date, index, array) => array.indexOf(date) === index)
            .sort((a, b) => b - a);

        let streak = 0;
        let expectedDate = todayStart.getTime();
        if (sessionDates[0] !== expectedDate) {
            expectedDate -= 24 * 60 * 60 * 1000;
        }
        for (const sessionDate of sessionDates) {
            if (sessionDate === expectedDate) {
                streak++;
                expectedDate -= 24 * 60 * 60 * 1000;
            } else break;
        }

        // Check minutes today
        const todaySessions = sessions.filter(s => {
            const sessionDate = new Date(s.created_date);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === todayStart.getTime();
        });
        const minutesToday = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const dailyGoal = user.daily_goal_minutes || 30;

        // Delete old coach recommendations
        const existingRecs = await base44.entities.AgentRecommendation.filter({
            created_by: user.email,
            is_active: true,
            agent_type: 'study_coach'
        });
        for (const rec of existingRecs) {
            await base44.entities.AgentRecommendation.delete(rec.id);
        }

        let coachPrompt = '';
        let recType = 'motivation';

        // Determine coaching scenario
        if (daysSinceLastPractice >= 3) {
            recType = 'streak_recovery';
            coachPrompt = `The user hasn't practiced in ${daysSinceLastPractice} days. They had a ${streak}-day streak before. Generate an encouraging message to help them restart.`;
        } else if (streak >= 7 && minutesToday === 0) {
            recType = 'streak_recovery';
            coachPrompt = `The user has an impressive ${streak}-day streak but hasn't practiced today yet. Generate a motivating reminder to keep the streak alive.`;
        } else if (minutesToday >= dailyGoal) {
            recType = 'motivation';
            coachPrompt = `The user has already hit their daily goal of ${dailyGoal} minutes today (practiced ${minutesToday} min). Celebrate their achievement and encourage them to keep going or rest.`;
        } else if (minutesToday > 0 && minutesToday < dailyGoal) {
            recType = 'goal_suggestion';
            coachPrompt = `The user has practiced ${minutesToday} minutes today but hasn't reached their ${dailyGoal}-minute goal yet. Encourage them to finish strong.`;
        } else {
            recType = 'motivation';
            coachPrompt = `The user has a ${streak}-day streak and ${sessions.length} total sessions. Generate a general motivational message to inspire today's practice.`;
        }

        const fullPrompt = `You are a supportive study coach for YKI exam preparation. ${coachPrompt}

Provide a coaching message in JSON format:
{
  "title": "Brief, encouraging title (max 8 words)",
  "message": "Warm, motivational message (2-3 sentences) that feels personal and supportive",
  "priority": <1-10>,
  "action_text": "Clear call-to-action button text"
}

Tone: Friendly, encouraging, understanding. Avoid being pushy.`;

        console.log('Calling LLM for coaching message...');
        const aiResponse = await Promise.race([
            base44.integrations.Core.InvokeLLM({
                prompt: fullPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        message: { type: "string" },
                        priority: { type: "number" },
                        action_text: { type: "string" }
                    }
                }
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('LLM timeout after 30s')), 30000)
            )
        ]);
        console.log('LLM response received:', aiResponse);

        // Create recommendation
        const recommendation = await base44.entities.AgentRecommendation.create({
            agent_type: 'study_coach',
            recommendation_type: recType,
            title: aiResponse.title,
            message: aiResponse.message,
            action_url: 'Practice',
            action_text: aiResponse.action_text || 'Start Practice',
            priority: aiResponse.priority || 5,
            metadata: {
                days_since_last_practice: daysSinceLastPractice,
                current_streak: streak,
                minutes_today: minutesToday,
                daily_goal: dailyGoal,
                total_sessions: sessions.length
            },
            is_active: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day
        });

        return Response.json({
            success: true,
            recommendation,
            coaching_context: {
                days_since_last_practice: daysSinceLastPractice,
                streak,
                minutes_today: minutesToday,
                daily_goal: dailyGoal
            }
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Proactive coach error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack
        }, { status: 500, headers: corsHeaders });
    }
});