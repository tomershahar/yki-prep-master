import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Placeholder for callOpenAI function, assuming it interacts with an OpenAI-compatible API
const callOpenAI = async (prompt: string, responseSchema: any, timeout: number = 45000): Promise<any> => {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const OPENAI_API_URL = Deno.env.get('OPENAI_API_URL') || 'https://api.openai.com/v1/chat/completions';
    const MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'; 

    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set.');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
    };

    const body = JSON.stringify({
        model: 'gpt-4o',
        messages: [
            { role: 'system', content: 'You are an expert YKI writing evaluator providing detailed, actionable feedback. Respond with valid JSON only.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }, 
        temperature: 0.3,
        max_tokens: 2000,
    });

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: headers,
            body: body,
            signal: controller.signal,
        });

        clearTimeout(id);

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content received from OpenAI API.');
        }

        try {
            return JSON.parse(content);
        } catch (jsonError) {
            console.error('Failed to parse AI response as JSON:', content);
            throw new Error('AI response was not valid JSON.');
        }

    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`OpenAI API request timed out after ${timeout / 1000} seconds.`);
        }
        throw error;
    }
};

Deno.serve(async (req) => {
    // Set CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        
        // Auth logic
        // Get the Authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        // Extract the token (assuming "Bearer TOKEN")
        const token = authHeader.split(" ")[1];
        if (!token) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        // Set the token in the base44 client
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        const { task, userResponse, difficulty, language, weakSpots } = await req.json();
        
        if (!task || !userResponse || !difficulty || !language) {
            return new Response(JSON.stringify({ 
                error: 'Missing required parameters: task, userResponse, difficulty, language' 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';
        
        // Build weak spots context
        let weakSpotsContext = '';
        if (weakSpots && weakSpots.length > 0) {
            weakSpotsContext = `\n\nIMPORTANT - Known weak areas for this student based on past performance:
${weakSpots.map(ws => `- ${ws.description} (occurred in ${ws.occurrences} recent sessions)`).join('\n')}

Pay special attention to these areas when evaluating. Check if the student is making progress or still struggling with these issues.`;
        }
        
        const prompt = `You are an expert YKI ${languageName} writing evaluator at the ${difficulty} CEFR level.

Task: "${task.prompt}"
Student's response: "${userResponse}"${weakSpotsContext}

Evaluate the student's response comprehensively. Provide detailed, actionable feedback in the following JSON format:

{
  "scores": {
    "task_fulfillment": <1-8, how well they completed the task>,
    "coherence_cohesion": <1-8, structure and flow>, 
    "vocabulary_range": <1-8, word choice and idiomatic language>,
    "grammatical_accuracy": <1-8, grammar and spelling>
  },
  "total_score": <4-32, sum of scores>,
  "feedback": {
    "strengths": "2-3 sentences highlighting what the student did well, with specific examples from their response.",
    "weaknesses": "2-3 sentences explaining main areas for improvement with specific examples.",
    "grammar_analysis": "Detailed analysis: identify 2-3 grammar patterns that need work (e.g., 'Incorrect verb conjugation in past tense: \\"minä menin\\" should be used instead of \\"minä meni\\"'), explain the rules, and suggest practice topics.",
    "vocabulary_style": "Analyze word choice sophistication, suggest 3-5 better alternatives for basic words used, comment on register appropriateness (formal/informal), and recommend vocabulary themes to study.",
    "structure_tips": "Evaluate paragraph organization, transition word usage, sentence variety. Provide 2-3 specific structural improvements.",
    "examples": "Give 1-2 concrete examples of how to rewrite weak sentences from the response, showing before and after.",
    "focus_areas": ["3-5 specific, prioritized learning topics with brief explanations"],
    "study_resources": "Suggest 2-3 specific grammar topics or resources to study next (e.g., 'Review conditional sentences (jos-clauses)', 'Practice using temporal conjunctions', 'Study formal letter conventions')"
  },
  "cefr_level": "<A1/A2/B1/B2, estimate the CEFR level of the response>"
}`;

        console.log(`Grading writing task for user ${user.email}, difficulty: ${difficulty}, text length: ${userResponse.length}`);

        const result = await callOpenAI(prompt, null, 45000);

        // Validate the result structure
        if (!result.scores || !result.total_score || !result.feedback || !result.cefr_level) {
            throw new Error('Invalid AI response structure');
        }

        console.log(`Writing grading completed. Score: ${result.total_score}/32`);

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (error) {
        console.error("Writing grading error:", error);
        return new Response(JSON.stringify({ 
            error: error.message,
            details: 'Backend writing grading failed'
        }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});