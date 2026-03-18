import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

function getDateKey(date) {
    const d = new Date(date);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function formatDisplayDate(isoDateKey) {
    const [year, month, day] = isoDateKey.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        const now = new Date();
        const todayKey = getDateKey(now);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Build daily buckets for last 30 days (visits) and last 7 days (display)
        const dailyVisits = new Map(); // dateKey -> { new: Set, returning: Set }
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const k = getDateKey(d);
            dailyVisits.set(k, { newUsers: new Set(), returningUsers: new Set() });
        }

        // Process UserVisit records — collect ALL visits (not just 30d) to determine
        // if a user is "new" or "returning" based on their real first-ever visit.
        const dailyActive = new Set();
        const weeklyActive = new Set();
        const monthlyActive = new Set();
        let totalVisitsLast30Days = 0;
        const allVisits = []; // collect all visits to sort and classify
        const recentActivityRaw = [];
        const userCache = new Map();

        // First pass: collect ALL visits (no date cutoff) to find each user's first-ever visit
        let visitOffset = 0;
        let processedVisits = 0;
        const userFirstVisitDate = {}; // user_id -> earliest timestamp string

        // We need to find the first visit for every user that visited in the last 30 days.
        // Load all visits sorted ascending (oldest first) — but the SDK only supports list/filter,
        // so we load newest-first and track per-user minimums.
        let hasMoreVisits = true;
        while (hasMoreVisits && processedVisits < 20000) {
            const batch = await base44.asServiceRole.entities.UserVisit.list('-timestamp', 500, visitOffset);
            if (!batch || batch.length === 0) break;

            for (const visit of batch) {
                if (!visit.user_id || !visit.timestamp) continue;
                processedVisits++;

                // Track earliest visit per user (since we're going newest→oldest, always overwrite)
                userFirstVisitDate[visit.user_id] = visit.timestamp;

                const visitDate = new Date(visit.timestamp);
                if (visitDate >= thirtyDaysAgo) {
                    allVisits.push(visit);
                    totalVisitsLast30Days++;
                    monthlyActive.add(visit.user_id);
                    if (visitDate >= sevenDaysAgo) weeklyActive.add(visit.user_id);
                    if (visitDate >= oneDayAgo) dailyActive.add(visit.user_id);
                    if (recentActivityRaw.length < 10) recentActivityRaw.push(visit);
                }
            }
            visitOffset += batch.length;
            // Stop once all batches are processed (no early termination on date)
            if (batch.length < 500) break;
        }

        // Now classify each visit: is the user "new" (first-ever visit day) or "returning"?
        // A user is "new" on a given day if that day is the same as their first-ever visit date.
        for (const visit of allVisits) {
            const visitDate = new Date(visit.timestamp);
            const dk = getDateKey(visitDate);
            if (!dailyVisits.has(dk)) continue;

            const day = dailyVisits.get(dk);
            const firstVisitKey = userFirstVisitDate[visit.user_id]
                ? getDateKey(new Date(userFirstVisitDate[visit.user_id]))
                : null;

            // If user's first-ever visit is on this day → new user; otherwise → returning
            if (firstVisitKey === dk) {
                day.newUsers.add(visit.user_id);
            } else {
                day.returningUsers.add(visit.user_id);
            }
        }

        // Build visits chart: last 30 days with dateKey + displayDate + counts
        const visitsChart30Days = Array.from(dailyVisits.entries()).map(([dateKey, day]) => ({
            dateKey,
            date: formatDisplayDate(dateKey),
            new: day.newUsers.size,
            returning: day.returningUsers.size,
            total: day.newUsers.size + day.returningUsers.size,
        }));

        // Today's stats
        const todayData = dailyVisits.get(todayKey) || { newUsers: new Set(), returningUsers: new Set() };
        const todayNewUsers = todayData.newUsers.size;
        const todayReturningUsers = todayData.returningUsers.size;

        // Process Practice Sessions
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
        let totalPracticeSessions = 0;
        const allActiveUserEmails = new Set();
        const sessionCountByEmail = {};
        const dailyEngagementData = new Map();
        const modules = ['reading', 'listening', 'speaking', 'writing'];
        const moduleStats = Object.fromEntries(modules.map(m => [m, { totalMinutes: 0, totalSessions: 0 }]));

        for (let i = 9; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const k = getDateKey(d);
            dailyEngagementData.set(k, { dateKey: k, date: formatDisplayDate(k), totalMinutes: 0, activeUsers: new Set(), averageMinutes: 0 });
        }

        // Score distribution
        const scoreDistribution = { 'A1': 0, 'A2': 0, 'B1': 0, 'B2': 0 };

        let sessionOffset = 0;
        let hasMoreSessions = true;
        let processedSessions = 0;

        while (hasMoreSessions && processedSessions < 6000) {
            const batch = await base44.asServiceRole.entities.PracticeSession.list('-created_date', 500, sessionOffset);
            if (!batch || batch.length === 0) break;

            for (const session of batch) {
                if (!session.created_by || !session.created_date) continue;
                const sessionDate = new Date(session.created_date);
                if (sessionDate < thirtyDaysAgo) { hasMoreSessions = false; break; }

                processedSessions++;
                totalPracticeSessions++;

                const email = session.created_by.toLowerCase();
                allActiveUserEmails.add(email);
                sessionCountByEmail[email] = (sessionCountByEmail[email] || 0) + 1;

                const durationMinutes = session.duration_minutes || 0;

                if (sessionDate >= tenDaysAgo) {
                    const dk = getDateKey(sessionDate);
                    if (dailyEngagementData.has(dk)) {
                        const day = dailyEngagementData.get(dk);
                        day.totalMinutes += durationMinutes;
                        day.activeUsers.add(email);
                    }
                }

                if (session.exam_section && moduleStats[session.exam_section]) {
                    moduleStats[session.exam_section].totalMinutes += durationMinutes;
                    moduleStats[session.exam_section].totalSessions++;
                }

                // Score distribution by difficulty level
                if (session.difficulty_level && scoreDistribution.hasOwnProperty(session.difficulty_level)) {
                    scoreDistribution[session.difficulty_level]++;
                }
            }

            sessionOffset += batch.length;
        }

        const dailyEngagementArray = Array.from(dailyEngagementData.values()).map(day => {
            const count = day.activeUsers.size;
            return {
                dateKey: day.dateKey,
                date: day.date,
                totalMinutes: Math.round(day.totalMinutes),
                activeUsers: count,
                averageMinutes: count > 0 ? Math.round(day.totalMinutes / count) : 0,
            };
        });

        // Resolve recent activity user names
        const recentActivity = [];
        for (const visit of recentActivityRaw) {
            let userData = userCache.get(visit.user_id);
            if (!userData) {
                try {
                    const users = await base44.asServiceRole.entities.User.filter({ id: visit.user_id }, '-created_date', 1);
                    userData = users?.[0] || null;
                    userCache.set(visit.user_id, userData);
                } catch (_) { userData = null; }
            }
            recentActivity.push({
                id: visit.id,
                user_name: userData?.full_name || `User ${visit.user_id?.substring(0, 6)}`,
                user_email: userData?.email || '',
                timestamp: visit.timestamp,
                returning: visit.returning,
            });
        }

        Object.values(moduleStats).forEach(stats => {
            stats.avgPerSession = stats.totalSessions > 0 ? parseFloat((stats.totalMinutes / stats.totalSessions).toFixed(1)) : 0;
            stats.totalMinutes = Math.round(stats.totalMinutes);
        });

        const totalUniqueUsers = allActiveUserEmails.size;

        // Top users by sessions
        const topUsers = Object.entries(sessionCountByEmail)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([email, count]) => ({ email, sessions: count }));

        return new Response(JSON.stringify({
            kpis: {
                uniqueUsers: totalUniqueUsers,
                totalPracticeSessions,
                dailyActiveUsers: dailyActive.size,
                weeklyActiveUsers: weeklyActive.size,
                monthlyActiveUsers: monthlyActive.size,
                todayNewUsers,
                todayReturningUsers,
                totalVisitsLast30Days,
                avgSessionsPerUser: totalUniqueUsers > 0 ? parseFloat((totalPracticeSessions / totalUniqueUsers).toFixed(1)) : 0,
            },
            moduleStats,
            chartData: {
                visitsChart: visitsChart30Days,
                visitsChart7Days: visitsChart30Days.slice(-7),
                engagementDistribution: dailyEngagementArray,
                timeSpent: modules.map(m => ({
                    module: m.charAt(0).toUpperCase() + m.slice(1),
                    totalMinutes: Math.round(moduleStats[m].totalMinutes),
                })),
                scoreDistribution: Object.entries(scoreDistribution).map(([level, count]) => ({ level, count })),
            },
            recentActivity,
            topUsers,
            meta: { processedVisits, processedSessions }
        }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error) {
        console.error("Analytics error:", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
});