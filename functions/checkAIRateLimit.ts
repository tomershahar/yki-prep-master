import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const RATE_LIMIT = 10; // calls per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': Deno.env.get("APP_URL") || '*',
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
            return Response.json({ error: 'Unauthorized' }, { 
                status: 401, 
                headers: corsHeaders
            });
        }

        // Admin users have unlimited access
        if (user.role === 'admin') {
            return Response.json({ 
                allowed: true, 
                remaining: 999,
                message: 'Admin - unlimited access'
            }, { headers: corsHeaders });
        }

        const { functionName } = await req.json();
        
        // Get usage logs from the last hour
        const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW).toISOString();
        const recentCalls = await base44.asServiceRole.entities.AIUsageLog.filter({
            user_email: user.email,
            timestamp: { $gte: oneHourAgo }
        });

        const callCount = recentCalls.length;
        const remaining = Math.max(0, RATE_LIMIT - callCount);

        if (callCount >= RATE_LIMIT) {
            // Find the oldest call to calculate reset time
            const oldestCall = recentCalls.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            )[0];
            
            const resetTime = new Date(new Date(oldestCall.timestamp).getTime() + RATE_LIMIT_WINDOW);
            const minutesUntilReset = Math.ceil((resetTime - Date.now()) / (60 * 1000));

            return Response.json({ 
                allowed: false,
                remaining: 0,
                resetTime: resetTime.toISOString(),
                minutesUntilReset,
                message: `AI call limit reached (${RATE_LIMIT}/hour). Try again in ${minutesUntilReset} minute${minutesUntilReset !== 1 ? 's' : ''}.`
            }, { headers: corsHeaders });
        }

        // Log this check/call
        if (functionName) {
            await base44.asServiceRole.entities.AIUsageLog.create({
                function_name: functionName,
                user_email: user.email,
                timestamp: new Date().toISOString()
            });
        }

        return Response.json({ 
            allowed: true,
            remaining: remaining - 1, // Account for this call
            message: `${remaining - 1} AI call${remaining - 1 !== 1 ? 's' : ''} remaining this hour`
        }, { headers: corsHeaders });

    } catch (error) {
        console.error("Rate limit check error:", error);
        return Response.json({ 
            error: error.message,
            allowed: false
        }, {
            status: 500,
            headers: corsHeaders
        });
    }
});