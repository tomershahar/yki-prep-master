import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json"
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get all visits in the last 30 days
        const recentVisits = await base44.entities.UserVisit.filter({
            timestamp: { "$gte": thirtyDaysAgo.toISOString() }
        });

        let checked = 0;
        let fixed = 0;

        // Find the first-ever visit time for each user involved to avoid repeated queries
        const userIds = [...new Set(recentVisits.map(v => v.user_id))];
        const userFirstVisitTimes = {};

        for (const userId of userIds) {
            const firstVisitRecords = await base44.entities.UserVisit.filter({ user_id: userId }, 'timestamp', 1);
            if (firstVisitRecords.length > 0) {
                userFirstVisitTimes[userId] = new Date(firstVisitRecords[0].timestamp).getTime();
            }
        }

        // Now, iterate through the recent visits and fix them
        for (const visit of recentVisits) {
            checked++;
            const firstVisitTime = userFirstVisitTimes[visit.user_id];
            const currentVisitTime = new Date(visit.timestamp).getTime();

            // A visit is "returning" if its timestamp is significantly later than the user's first-ever visit.
            const shouldBeReturning = firstVisitTime ? (currentVisitTime - firstVisitTime) > 5000 : false; // 5 second buffer

            if (visit.returning !== shouldBeReturning) {
                await base44.entities.UserVisit.update(visit.id, { returning: shouldBeReturning });
                fixed++;
            }
        }

        const message = `Checked ${checked} visits from the last 30 days. Corrected ${fixed} records.`;
        return new Response(JSON.stringify({ message, checked, fixed }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("Fix history error:", error);
        return new Response(JSON.stringify({ 
            status: "error",
            error: error.message 
        }), { status: 500, headers: corsHeaders });
    }
});