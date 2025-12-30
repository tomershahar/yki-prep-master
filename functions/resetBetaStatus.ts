import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response('Access denied - admin only', { status: 403 });
        }

        // Reset current user's beta status for testing
        await base44.entities.User.updateMyUserData({
            has_agreed_to_beta_terms: false,
            beta_agreement_date: null
        });

        return new Response(JSON.stringify({
            success: true,
            message: "Your beta status has been reset. You'll see the beta disclaimer on next page reload."
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("Reset beta status error:", error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});