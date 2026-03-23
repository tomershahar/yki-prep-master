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

        // Fetch user's practice sessions
        const sessions = await base44.entities.PracticeSession.filter(
            { created_by: user.email },
            '-created_date',
            100
        );

        // Analyze performance by section
        const sections = ['reading', 'listening', 'speaking', 'writing'];
        const sectionAnalysis = {};

        sections.forEach(section => {
            const sectionSessions = sessions.filter(s => s.exam_section === section);
            const avgScore = sectionSessions.length > 0 
                ? sectionSessions.reduce((sum, s) => sum + (s.score || 0), 0) / sectionSessions.length
                : 0;
            const totalTime = sectionSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
            const recentSessions = sectionSessions.slice(0, 5);
            const recentAvg = recentSessions.length > 0
                ? recentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / recentSessions.length
                : 0;

            sectionAnalysis[section] = {
                totalSessions: sectionSessions.length,
                avgScore,
                totalTime,
                recentAvg,
                currentLevel: user[`${section}_level`] || 'A1',
                needsWork: avgScore < 70 || sectionSessions.length < 3
            };
        });

        // Find weakest section
        const weakestSection = sections.reduce((weakest, section) => {
            const current = sectionAnalysis[section];
            const weak = sectionAnalysis[weakest];
            if (current.needsWork && current.avgScore < weak.avgScore) {
                return section;
            }
            return weakest;
        }, sections[0]);

        // Check for existing active recommendations
        const existingRecs = await base44.entities.AgentRecommendation.filter(
            { 
                created_by: user.email,
                is_active: true,
                agent_type: 'adaptive_learning'
            }
        );

        // Delete old recommendations
        for (const rec of existingRecs) {
            await base44.entities.AgentRecommendation.delete(rec.id);
        }

        // Generate new recommendation using AI
        const analysisPrompt = `You are an adaptive learning coach for YKI exam preparation. Analyze this student's performance and provide ONE specific, actionable recommendation.

Student Performance Analysis:
${sections.map(s => `- ${s}: ${sectionAnalysis[s].totalSessions} sessions, avg score ${Math.round(sectionAnalysis[s].avgScore)}%, level ${sectionAnalysis[s].currentLevel}`).join('\n')}

Weakest area: ${weakestSection} (${Math.round(sectionAnalysis[weakestSection].avgScore)}% avg)

Provide a recommendation in JSON format:
{
  "title": "Brief, motivating title (max 10 words)",
  "message": "Specific, actionable guidance (2-3 sentences) that explains WHY this section needs work and HOW to improve",
  "priority": <1-10, based on urgency>,
  "suggested_section": "${weakestSection}",
  "suggested_difficulty": "<A1, A2, B1, or B2 - recommend current level or one below if struggling>"
}

Be encouraging but honest. Focus on one clear action.`;

        console.log('Calling LLM for adaptive learning recommendation...');
        const aiResponse = await Promise.race([
            base44.integrations.Core.InvokeLLM({
                prompt: analysisPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        message: { type: "string" },
                        priority: { type: "number" },
                        suggested_section: { type: "string" },
                        suggested_difficulty: { type: "string" }
                    }
                }
            }),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('LLM timeout after 30s')), 30000)
            )
        ]);
        console.log('LLM response received:', aiResponse);

        // Create recommendation entity
        const recommendation = await base44.entities.AgentRecommendation.create({
            agent_type: 'adaptive_learning',
            recommendation_type: 'practice_section',
            title: aiResponse.title,
            message: aiResponse.message,
            action_url: `Practice?start=${aiResponse.suggested_section}`,
            action_text: `Practice ${aiResponse.suggested_section.charAt(0).toUpperCase() + aiResponse.suggested_section.slice(1)}`,
            priority: aiResponse.priority || 7,
            metadata: {
                section_analysis: sectionAnalysis,
                weakest_section: weakestSection,
                suggested_difficulty: aiResponse.suggested_difficulty
            },
            is_active: true,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

        return Response.json({
            success: true,
            recommendation,
            analysis: sectionAnalysis
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('Adaptive learning agent error:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500, headers: corsHeaders });
    }
});