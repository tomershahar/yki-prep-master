import { createClient } from 'npm:@base44/sdk@0.1.0';

const callOpenAI = async (prompt, responseSchema, timeout = 30000) => {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
        throw new Error("OpenAI API key not found");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Using mini for faster responses
                messages: [
                    {
                        role: "system",
                        content: "You are a YKI speaking evaluator. Respond with valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 800,
                response_format: { type: "json_object" }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('AI grading timeout (30s)');
        }
        throw error;
    }
};

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
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        const { task, userTranscription, difficulty, language } = await req.json();
        
        if (!task || !userTranscription || !difficulty || !language) {
            return new Response(JSON.stringify({ 
                error: 'Missing required parameters: task, userTranscription, difficulty, language' 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';
        
        const prompt = `Evaluate this YKI ${languageName} speaking response at level ${difficulty}.

Task: "${task.prompt}"
Student response: "${userTranscription}"

Grade on 1-8 scale for each criterion and provide brief feedback:

{
  "scores": {
    "communicative_ability": <1-8>,
    "coherence": <1-8>, 
    "vocabulary": <1-8>,
    "grammar": <1-8>
  },
  "total_score": <4-32>,
  "feedback": {
    "strengths": "What the student did well (1-2 sentences)",
    "weaknesses": "Areas for improvement (1-2 sentences)"
  },
  "cefr_level": "<A1/A2/B1/B2>"
}`;

        console.log(`Grading speaking task for user ${user.email}, difficulty: ${difficulty}, text length: ${userTranscription.length}`);

        const result = await callOpenAI(prompt, null, 30000);

        // Validate the result structure
        if (!result.scores || !result.total_score || !result.feedback || !result.cefr_level) {
            throw new Error('Invalid AI response structure');
        }

        console.log(`Speaking grading completed. Score: ${result.total_score}/32`);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (error) {
        console.error("Speaking grading error:", error);
        return new Response(JSON.stringify({ 
            error: error.message,
            details: 'Backend speaking grading failed'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});