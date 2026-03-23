import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
const CONFIG_KEY = 'last_visit_processing_timestamp';

// Consistent CORS headers for all responses
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json"
};

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // This is a system job, but we'll still do a basic auth check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }
        base44.auth.setToken(authHeader.split(' ')[1]);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Access denied.' }), { status: 403, headers: corsHeaders });
        }
        
        const startTime = new Date();
        console.log(`[${startTime.toISOString()}] Starting recent visits processing job.`);

        // 1. Get the last run timestamp from SystemConfig
        const configEntries = await base44.entities.SystemConfig.filter({ key: CONFIG_KEY });
        const lastRunConfig = configEntries?.[0];
        const lastRunTimestamp = lastRunConfig?.value?.timestamp || new Date(0).toISOString();
        
        console.log(`Processing visits created after: ${lastRunTimestamp}`);

        // 2. Fetch only new visits (the "delta")
        const recentVisits = await base44.entities.UserVisit.filter(
            { created_date: { "$gt": lastRunTimestamp } },
            'created_date' // sort ascending
        );

        if (recentVisits.length === 0) {
            const message = "No new visits to process.";
            console.log(message);
            return new Response(JSON.stringify({ status: 'success', message }), { status: 200, headers: corsHeaders });
        }

        console.log(`Found ${recentVisits.length} new visits to process.`);
        let correctedRecords = 0;

        // 3. Process each new visit
        for (const visit of recentVisits) {
            // Efficiently check for any single visit from this user *before* the current one
            const priorVisits = await base44.entities.UserVisit.filter(
                { 
                    user_id: visit.user_id,
                    created_date: { "$lt": visit.created_date }
                },
                '-created_date', // sort descending for speed
                1 // we only need to know if at least one exists
            );
            
            const expectedReturningStatus = priorVisits.length > 0;

            if (visit.returning !== expectedReturningStatus) {
                await base44.entities.UserVisit.update(visit.id, { returning: expectedReturningStatus });
                correctedRecords++;
            }
        }

        // 4. Update the last run timestamp in SystemConfig
        const newTimestamp = new Date().toISOString();
        if (lastRunConfig) {
            await base44.entities.SystemConfig.update(lastRunConfig.id, { value: { timestamp: newTimestamp } });
        } else {
            await base44.entities.SystemConfig.create({ key: CONFIG_KEY, value: { timestamp: newTimestamp } });
        }
        
        const message = `Successfully processed ${recentVisits.length} new visits. Corrected ${correctedRecords} records. Next run will process visits after ${newTimestamp}.`;
        console.log(message);

        return new Response(JSON.stringify({ status: 'success', message }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("Error processing recent visits:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});