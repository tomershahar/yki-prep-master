import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json"
};

// Helper function to add delay between operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        console.log("Starting robust last week visits fix...");

        // Step 1: Get all visits in the last 7 days
        const recentVisits = await base44.entities.UserVisit.filter({
            timestamp: { "$gte": sevenDaysAgo.toISOString() }
        }, 'timestamp');

        if (recentVisits.length === 0) {
            return new Response(JSON.stringify({ message: "No visits to process." }), { status: 200, headers: corsHeaders });
        }

        // Step 2: Get unique user IDs
        const uniqueUserIds = [...new Set(recentVisits.map(v => v.user_id))];
        console.log(`Processing ${uniqueUserIds.length} unique users across ${recentVisits.length} visits.`);

        // Step 3: Get first-ever visit for each user, in batches, to avoid rate limits
        const userFirstVisits = new Map();
        const userBatchSize = 10;
        for (let i = 0; i < uniqueUserIds.length; i += userBatchSize) {
            const batchUserIds = uniqueUserIds.slice(i, i + userBatchSize);
            const promises = batchUserIds.map(userId => 
                base44.entities.UserVisit.filter({ user_id: userId }, 'timestamp', 1)
                    .then(visits => {
                        if (visits.length > 0) {
                            userFirstVisits.set(userId, new Date(visits[0].timestamp));
                        }
                    })
            );
            await Promise.all(promises);
            console.log(`Processed user batch ${Math.floor(i / userBatchSize) + 1} of ${Math.ceil(uniqueUserIds.length / userBatchSize)}...`);
            await delay(1000); // Wait 1 second between batches
        }

        console.log(`Gathered first-visit data for ${userFirstVisits.size} users.`);

        // Step 4: Determine which visits need fixing
        const updates = [];
        let checked = 0;
        for (const visit of recentVisits) {
            checked++;
            const firstVisitDate = userFirstVisits.get(visit.user_id);
            if (!firstVisitDate) continue;

            const timeDifference = new Date(visit.timestamp).getTime() - firstVisitDate.getTime();
            const shouldBeReturning = timeDifference > 5000; // 5-second buffer for the very first visit

            if (visit.returning !== shouldBeReturning) {
                updates.push({ id: visit.id, returning: shouldBeReturning });
            }
        }

        console.log(`Found ${updates.length} visits to correct.`);

        // Step 5: Apply updates in batches
        let fixed = 0;
        const updateBatchSize = 10;
        for (let i = 0; i < updates.length; i += updateBatchSize) {
            const batchUpdates = updates.slice(i, i + updateBatchSize);
            const updatePromises = batchUpdates.map(update => 
                base44.entities.UserVisit.update(update.id, { returning: update.returning })
            );
            await Promise.all(updatePromises);
            fixed += batchUpdates.length;
            console.log(`Updated batch ${Math.floor(i / updateBatchSize) + 1} of ${Math.ceil(updates.length / updateBatchSize)}...`);
            await delay(1000); // Wait 1 second
        }

        const message = `Checked ${checked} visits. Corrected ${fixed} records.`;
        console.log(message);
        
        return new Response(JSON.stringify({ message, checked, fixed, status: "success" }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("Fix last week visits error:", error);
        return new Response(JSON.stringify({ status: "error", error: error.message }), { status: 500, headers: corsHeaders });
    }
});