import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { userId, userEmail } = await req.json();

        // Fetch user's target level
        const targetUser = await base44.asServiceRole.entities.User.get(userId || user.id);
        const targetLevel = targetUser.target_level || 'B1';

        // Fetch last 20 practice sessions (to get 10 per section max)
        const sessions = await base44.asServiceRole.entities.PracticeSession.filter(
            { created_by: userEmail || user.email },
            '-created_date',
            20
        );

        // Check if sufficient data
        const sufficientData = sessions.length >= 5;
        
        if (!sufficientData) {
            return Response.json({
                score: 0,
                level: 'YKI Beginner',
                sufficient_data: false,
                message: 'Complete 5-10 practice sessions to get your personalized readiness assessment'
            });
        }

        // Calculate section performance (60% weight)
        const sectionScores = calculateSectionScores(sessions, targetLevel);
        const sectionPerformance = (sectionScores.reading + sectionScores.listening + 
                                    sectionScores.writing + sectionScores.speaking) / 4;

        // Calculate practice quality (25% weight)
        const practiceQuality = calculatePracticeQuality(sessions);

        // Calculate benchmark alignment (15% weight)
        const benchmarkAlignment = calculateBenchmarkAlignment(sectionPerformance);

        // Final readiness score
        const readinessScore = Math.round(
            (sectionPerformance * 0.60) +
            (practiceQuality * 0.25) +
            (benchmarkAlignment * 0.15)
        );

        // Map to level
        const level = 
            readinessScore >= 86 ? 'YKI Ready' :
            readinessScore >= 66 ? 'YKI Candidate' :
            readinessScore >= 41 ? 'YKI Learner' :
            'YKI Beginner';

        // Save or update readiness score
        const existingScores = await base44.asServiceRole.entities.ReadinessScore.filter({
            user_email: userEmail || user.email
        });

        const scoreData = {
            user_email: userEmail || user.email,
            score: readinessScore,
            level: level,
            section_scores: sectionScores,
            section_performance: sectionPerformance,
            practice_quality: practiceQuality,
            benchmark_alignment: benchmarkAlignment,
            target_level: targetLevel,
            sufficient_data: true,
            last_calculated: new Date().toISOString()
        };

        let savedScore;
        if (existingScores.length > 0) {
            savedScore = await base44.asServiceRole.entities.ReadinessScore.update(
                existingScores[0].id,
                scoreData
            );
        } else {
            savedScore = await base44.asServiceRole.entities.ReadinessScore.create(scoreData);
        }

        return Response.json({
            score: readinessScore,
            level: level,
            section_scores: sectionScores,
            sufficient_data: true,
            id: savedScore.id
        });

    } catch (error) {
        console.error('Readiness calculation error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateSectionScores(sessions, targetLevel) {
    const sections = ['reading', 'listening', 'writing', 'speaking'];
    const targetLevelFactors = { 'A1': 0.7, 'A2': 0.85, 'B1': 1.0, 'B2': 1.15 };
    const targetFactor = targetLevelFactors[targetLevel] || 1.0;

    const scores = {};

    for (const section of sections) {
        const sectionSessions = sessions
            .filter(s => s.exam_section === section)
            .slice(0, 10);

        if (sectionSessions.length === 0) {
            scores[section] = 0;
            continue;
        }

        const avgScore = sectionSessions.reduce((sum, s) => sum + (s.score || 0), 0) / sectionSessions.length;
        
        // Apply difficulty level factor
        const difficultyFactor = sectionSessions[0]?.difficulty_level 
            ? targetLevelFactors[sectionSessions[0].difficulty_level] / targetFactor
            : 1.0;

        scores[section] = Math.min(100, Math.round(avgScore * difficultyFactor));
    }

    return scores;
}

function calculatePracticeQuality(sessions) {
    let points = 0;

    // Consistency (15 points): practiced in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentPractice = sessions.some(s => new Date(s.created_date) > sevenDaysAgo);
    if (recentPractice) points += 15;

    // Balance (10 points): all 4 sections in last 2 weeks
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const recentSections = new Set(
        sessions
            .filter(s => new Date(s.created_date) > twoWeeksAgo)
            .map(s => s.exam_section)
    );
    if (recentSections.size === 4) points += 10;

    // Volume (5 points): at least 15 total sessions
    if (sessions.length >= 15) points += 5;

    // Normalize to 0-100 scale
    return Math.round((points / 30) * 100);
}

function calculateBenchmarkAlignment(sectionAverage) {
    const passingThreshold = 60;
    const alignment = (sectionAverage / passingThreshold) * 100;
    return Math.min(100, Math.round(alignment));
}