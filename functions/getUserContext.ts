import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Reusable function to get standardized user context for AI agents
 * Returns comprehensive user data including preferences, levels, progress, and recent performance
 */
export async function getUserContext(req) {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Get recent practice sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSessions = await base44.entities.PracticeSession.filter(
        { 
            created_by: user.email,
            created_date: { "$gte": thirtyDaysAgo.toISOString() }
        },
        '-created_date',
        50
    );

    // Calculate performance metrics per section
    const sectionMetrics = {};
    ['reading', 'listening', 'speaking', 'writing'].forEach(section => {
        const sectionSessions = recentSessions.filter(s => s.exam_section === section);
        const avgScore = sectionSessions.length > 0 
            ? sectionSessions.reduce((sum, s) => sum + (s.score || 0), 0) / sectionSessions.length 
            : 0;
        
        sectionMetrics[section] = {
            level: user[`${section}_level`] || 'A1',
            sessions_count: sectionSessions.length,
            average_score: Math.round(avgScore),
            total_hours: (user[`${section}_hours_trained`] || 0)
        };
    });

    // Build standardized context object
    const userContext = {
        // Identity & Preferences
        user_id: user.id,
        user_email: user.email,
        target_language: user.target_language || 'finnish',
        
        // Current Skill Levels
        reading_level: user.reading_level || 'A1',
        listening_level: user.listening_level || 'A1',
        speaking_level: user.speaking_level || 'A1',
        writing_level: user.writing_level || 'A1',
        
        // Goals & Progress
        daily_goal_minutes: user.daily_goal_minutes || 30,
        total_hours_trained: user.total_hours_trained || 0,
        
        // Performance Metrics
        section_performance: sectionMetrics,
        
        // Recent Activity Summary
        recent_sessions_count: recentSessions.length,
        last_practice_date: recentSessions.length > 0 ? recentSessions[0].created_date : null,
        
        // Achievements
        achievements_count: (user.achievements || []).length,
        
        // Learning Philosophy
        show_grammar_tips: user.show_grammar_tips !== false,
    };

    return userContext;
}

// Deno server endpoint for testing/direct access
Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        const userContext = await getUserContext(req);
        
        return Response.json({
            status: 'success',
            context: userContext
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    } catch (error) {
        console.error('Error getting user context:', error);
        return Response.json({
            status: 'error',
            message: error.message
        }, {
            status: error.message.includes('authenticated') ? 401 : 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    }
});