
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

// Helper function to normalize dates to UTC for consistent daily buckets
function normalizeToUTCDay(date) {
    const utcDate = new Date(date);
    return new Date(Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate()));
}

// Helper function to get date string for grouping
function getDateKey(date) {
    const normalized = normalizeToUTCDay(date);
    return normalized.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        console.log('Starting optimized analytics calculation...');

        // Setup normalized date ranges in UTC
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

        // Create a user cache to avoid repeated lookups
        const userCache = new Map();
        const getUserData = async (userId) => {
            if (userCache.has(userId)) {
                return userCache.get(userId);
            }
            
            try {
                const users = await base44.asServiceRole.entities.User.filter({ id: userId }, '-created_date', 1);
                const userData = users?.[0] || null;
                userCache.set(userId, userData);
                return userData;
            } catch (error) {
                console.warn(`Failed to fetch user ${userId}:`, error.message);
                userCache.set(userId, null);
                return null;
            }
        };

        // Initialize tracking variables
        const allActiveUserEmails = new Set();
        const allActiveUserIds = new Set();
        let totalVisitsLast30Days = 0;
        const dailyActive = new Set();
        const weeklyActive = new Set();
        const monthlyActive = new Set();
        const recentActivityRaw = [];

        // Setup for Daily Visits Chart (last 7 days) - FIXED FOR MONDAY START
        const visitsChartDataMap = new Map();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = getDateKey(date);
            visitsChartDataMap.set(dateKey, {
                // FIXED: Use Finnish locale with Monday as first day of week for display
                date: date.toLocaleDateString('fi-FI', { month: 'short', day: 'numeric' }),
                newUsers: new Set(),
                returningUsers: new Set(),
                new: 0,
                returning: 0
            });
        }

        // Process Visits with proper date filtering
        console.log('Processing user visits...');
        let visitOffset = 0;
        const visitBatchSize = 500;
        let hasMoreVisits = true;
        let processedVisits = 0;
        const visitsByUser = {};

        while (hasMoreVisits && processedVisits < 8000) {
            const batch = await base44.asServiceRole.entities.UserVisit.list('-timestamp', visitBatchSize, visitOffset);
            if (!batch || batch.length === 0) {
                hasMoreVisits = false;
                break;
            }

            for (const visit of batch) {
                if (!visit.user_id || !visit.timestamp) continue;
                
                const visitDate = new Date(visit.timestamp);
                
                // Early termination if too old (more than 30 days)
                if (visitDate < thirtyDaysAgo) {
                    hasMoreVisits = false;
                    break;
                }
                
                processedVisits++;
                
                // Track user activity by date ranges
                monthlyActive.add(visit.user_id);
                if (visitDate >= sevenDaysAgo) weeklyActive.add(visit.user_id);
                if (visitDate >= oneDayAgo) dailyActive.add(visit.user_id);
                
                // Daily visits chart data (last 7 days only)
                const visitDateKey = getDateKey(visitDate);
                if (visitsChartDataMap.has(visitDateKey)) {
                    const dayData = visitsChartDataMap.get(visitDateKey);
                    
                    // Add user to the appropriate set based on their returning status
                    if (visit.returning) { 
                        dayData.returningUsers.add(visit.user_id);
                    } else {
                        dayData.newUsers.add(visit.user_id);
                    }
                }
                
                totalVisitsLast30Days++;
                
                // Track visits per user for statistics
                if (!visitsByUser[visit.user_id]) visitsByUser[visit.user_id] = [];
                visitsByUser[visit.user_id].push(visit.timestamp);
                
                // Collect recent activity with real user data (limit to 15 most recent)
                if (recentActivityRaw.length < 15) {
                    recentActivityRaw.push(visit);
                }
            }
            
            visitOffset += batch.length;
        }

        console.log(`Processed ${processedVisits} visits from ${monthlyActive.size} unique users`);

        // Calculate visit statistics
        let newVisits = 0;
        let returningVisits = 0;
        Object.keys(visitsByUser).forEach(userId => {
            const userVisits = visitsByUser[userId];
            newVisits++;
            if (userVisits.length > 1) {
                returningVisits += userVisits.length - 1;
            }
        });

        // Convert Sets to counts for the chart
        // visitsChartDataMap is populated chronologically, so Array.from will maintain order.
        const visitsChartArray = Array.from(visitsChartDataMap.values()).map(dayData => ({
            date: dayData.date,
            new: dayData.newUsers.size,
            returning: dayData.returningUsers.size
        }));


        // Process Practice Sessions with date filtering and daily tracking
        console.log('Processing practice sessions...');
        let totalPracticeSessions = 0;
        const sessionCountByEmail = {};
        const dailyEngagementData = new Map();
        const userSessionDates = {};
        const modules = ['reading', 'listening', 'speaking', 'writing'];
        const moduleStats = Object.fromEntries(modules.map(m => [m, { totalMinutes: 0, totalSessions: 0 }]));

        // Initialize daily engagement map for last 10 days
        for (let i = 9; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateKey = getDateKey(date);
            dailyEngagementData.set(dateKey, {
                date: date.toLocaleDateString('fi-FI', { month: 'short', day: 'numeric' }),
                dateKey: dateKey,
                totalMinutes: 0,
                activeUsers: new Set(),
                averageMinutes: 0
            });
        }

        let sessionOffset = 0;
        const sessionBatchSize = 500;
        let hasMoreSessions = true;
        let processedSessions = 0;

        while (hasMoreSessions && processedSessions < 6000) {
            const batch = await base44.asServiceRole.entities.PracticeSession.list('-created_date', sessionBatchSize, sessionOffset);
            if (!batch || batch.length === 0) {
                hasMoreSessions = false;
                break;
            }
            
            for (const session of batch) {
                if (!session.created_by || !session.created_date) continue;
                
                const sessionDate = new Date(session.created_date);
                
                // Early termination if older than 30 days
                if (sessionDate < thirtyDaysAgo) {
                    hasMoreSessions = false;
                    break;
                }
                
                processedSessions++;
                totalPracticeSessions++;
                
                const email = session.created_by.toLowerCase();
                allActiveUserEmails.add(email);
                sessionCountByEmail[email] = (sessionCountByEmail[email] || 0) + 1;
                
                const durationMinutes = session.duration_minutes || 0;
                
                // Track daily engagement data (last 10 days only)
                if (sessionDate >= tenDaysAgo) {
                    const sessionDateKey = getDateKey(sessionDate);
                    if (dailyEngagementData.has(sessionDateKey)) {
                        const dayData = dailyEngagementData.get(sessionDateKey);
                        dayData.totalMinutes += durationMinutes;
                        dayData.activeUsers.add(email);
                    }
                }
                
                // Track active dates per user
                const userSessionDateKey = getDateKey(sessionDate);
                if (!userSessionDates[email]) userSessionDates[email] = new Set();
                userSessionDates[email].add(userSessionDateKey);
                
                // Module statistics
                if (session.exam_section && moduleStats[session.exam_section]) {
                    moduleStats[session.exam_section].totalMinutes += durationMinutes;
                    moduleStats[session.exam_section].totalSessions++;
                }
            }
            
            sessionOffset += batch.length;
        }

        console.log(`Processed ${processedSessions} practice sessions`);

        // Calculate daily averages for the engagement time series chart
        const dailyEngagementArray = [];
        const sortedEngagementDateKeys = Array.from(dailyEngagementData.keys()).sort();
        for (const dateKey of sortedEngagementDateKeys) {
            const dayData = dailyEngagementData.get(dateKey);
            const activeUserCount = dayData.activeUsers.size;
            dayData.averageMinutes = activeUserCount > 0 ? Math.round(dayData.totalMinutes / activeUserCount) : 0;
            
            dailyEngagementArray.push({
                // FIXED: Use Finnish locale for consistency
                date: new Date(dateKey).toLocaleDateString('fi-FI', { month: 'short', day: 'numeric' }),
                dateKey: dateKey,
                totalMinutes: dayData.totalMinutes,
                activeUsers: activeUserCount,
                averageMinutes: dayData.averageMinutes
            });
        }

        dailyEngagementArray.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

        const totalUniqueUsers = allActiveUserEmails.size;

        // KPI calculations
        const kpis = {
            totalVisits: totalVisitsLast30Days,
            uniqueUsers: totalUniqueUsers,
            returningVisits,
            newVisits,
            avgSessionsPerUser: totalUniqueUsers > 0 ? (totalPracticeSessions / totalUniqueUsers).toFixed(1) : 0,
            totalPracticeSessions: totalPracticeSessions,
            dailyActiveUsers: dailyActive.size,
            weeklyActiveUsers: weeklyActive.size,
            monthlyActiveUsers: monthlyActive.size
        };

        // Chart data preparation
        const chartData = {
            visitsChart: visitsChartArray,
            engagementDistribution: dailyEngagementArray,
            timeSpent: modules.map(m => ({ 
                module: m.charAt(0).toUpperCase() + m.slice(1), 
                totalMinutes: Math.round(moduleStats[m].totalMinutes) 
            }))
        };

        // Recent activity with real user data
        const recentActivity = [];
        for (const visit of recentActivityRaw.slice(0, 10)) {
            const userData = await getUserData(visit.user_id);
            recentActivity.push({
                id: visit.id || `activity-${visit.user_id}`,
                user_name: userData?.full_name || `User ${visit.user_id?.substring(0, 8)}`,
                user_email: userData?.email || 'anonymous@example.com',
                user_id: visit.user_id,
                timestamp: visit.timestamp,
                returning: visitsByUser[visit.user_id] && visitsByUser[visit.user_id].length > 1
            });
        }

        // Calculate module averages
        Object.values(moduleStats).forEach(stats => {
            stats.avgPerSession = stats.totalSessions > 0 ? parseFloat((stats.totalMinutes / stats.totalSessions).toFixed(1)) : 0;
            stats.totalMinutes = Math.round(stats.totalMinutes);
        });

        console.log(`Analytics completed successfully: ${totalUniqueUsers} unique users, ${totalVisitsLast30Days} visits, ${totalPracticeSessions} sessions`);

        return new Response(JSON.stringify({ 
            kpis, 
            moduleStats, 
            chartData, 
            recentActivity,
            meta: {
                processedVisits,
                processedSessions,
                cachedUsers: userCache.size
            }
        }), {
            status: 200, 
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Analytics error:", error);
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack
        }), {
            status: 500, 
            headers: { "Content-Type": "application/json" }
        });
    }
});
