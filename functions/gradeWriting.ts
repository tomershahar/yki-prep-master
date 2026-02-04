import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const callOpenAI = async (prompt, timeout = 60000) => {
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
                model: "gpt-4o",
                messages: [
                    {
                       role: "system",
                       content: "You are an expert language proficiency writing evaluator (YKI/Swedex/PD3) providing detailed, actionable feedback. Respond with valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000,
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
            throw new Error('AI grading timeout (60s)');
        }
        throw error;
    }
};

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
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        // Check rate limit
        const rateLimitCheck = await base44.functions.invoke('checkAIRateLimit', { 
            functionName: 'gradeWriting' 
        });
        
        if (!rateLimitCheck.allowed) {
            return new Response(JSON.stringify({ 
                error: 'Rate limit exceeded',
                message: rateLimitCheck.message,
                resetTime: rateLimitCheck.resetTime,
                minutesUntilReset: rateLimitCheck.minutesUntilReset
            }), { 
                status: 429, 
                headers: { "Content-Type": "application/json", ...corsHeaders }
            });
        }

        const { task, userResponse, difficulty, language, weakSpots, testType } = await req.json();
        
        if (!task || !userResponse || !difficulty || !language) {
            return new Response(JSON.stringify({ 
                error: 'Missing required parameters: task, userResponse, difficulty, language' 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }
        
        const validatedWeakSpots = Array.isArray(weakSpots) ? weakSpots : [];
        const sanitizedResponse = String(userResponse)
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .substring(0, 5000);

        const languageMap = {
            'finnish': 'Finnish',
            'swedish': 'Swedish',
            'danish': 'Danish'
        };
        const languageName = languageMap[language] || 'Finnish';
        const testName = testType || 'YKI';
        
        let weakSpotsContext = '';
        if (validatedWeakSpots.length > 0) {
            weakSpotsContext = `\n\nIMPORTANT - Known weak areas for this student based on past performance:
${validatedWeakSpots.map(ws => `- ${ws.description || 'Unknown issue'} (occurred in ${ws.occurrences || 1} recent sessions)`).join('\n')}

Pay special attention to these areas when evaluating.`;
        }
        
        const prompt = `You are an expert ${testName} ${languageName} writing evaluator at the ${difficulty} level.

Task: "${task.prompt}"
Student's response: "${sanitizedResponse}"${weakSpotsContext}

CRITICAL: First check if the student's response actually addresses ALL requirements in the task prompt. If they missed key elements or answered a different question, give very low scores (1-2) for communicative_ability and explain clearly what was missed.

Evaluate the student's response comprehensively. Provide detailed, actionable feedback in the following JSON format:

{
  "scores": {
    "communicative_ability": <1-8, how well they completed the task - BE STRICT: if they didn't answer the prompt correctly, score 1-2>,
    "coherence": <1-8, structure and flow>, 
    "vocabulary": <1-8, word choice and idiomatic language>,
    "grammar": <1-8, grammar and spelling>
  },
  "total_score": <4-32, sum of scores>,
  "feedback": {
    "strengths": "2-3 sentences highlighting what the student did well, with specific examples.",
    "weaknesses": "2-3 sentences explaining main areas for improvement. If task wasn't completed correctly, mention EXACTLY what was missing from the prompt.",
    "grammar_analysis": "Detailed analysis: identify 2-3 grammar patterns that need work, explain the rules, and suggest practice topics.",
    "vocabulary_style": "Analyze word choice sophistication, suggest 3-5 better alternatives for basic words used, comment on register appropriateness.",
    "structure_tips": "Evaluate paragraph organization, transition word usage, sentence variety. Provide 2-3 specific improvements.",
    "examples": "Give 1-2 concrete examples of how to rewrite weak sentences from the response.",
    "focus_areas": ["3-5 specific, prioritized learning topics"],
    "study_resources": "Suggest 2-3 specific grammar topics or resources to study next"
  },
  "cefr_level": "<A1/A2/B1/B2, estimate the CEFR level of the response>"
}`;

        console.log(`Grading writing task for user ${user.email}, difficulty: ${difficulty}, text length: ${sanitizedResponse.length}`);

        const result = await callOpenAI(prompt, 60000);

        // Validate result structure
        if (!result.scores || typeof result.total_score !== 'number' || !result.feedback || !result.cefr_level) {
            console.error('Invalid AI response structure:', result);
            throw new Error('Invalid AI response structure');
        }
        
        // Validate individual scores
        const scoreKeys = ['communicative_ability', 'coherence', 'vocabulary', 'grammar'];
        for (const key of scoreKeys) {
            const score = result.scores[key];
            if (typeof score !== 'number' || score < 1 || score > 8) {
                console.error(`Invalid score for ${key}: ${score}`);
                throw new Error(`Invalid score for ${key}: must be between 1-8`);
            }
        }
        
        // Validate total score
        if (result.total_score < 4 || result.total_score > 32) {
            console.error(`Invalid total_score: ${result.total_score}`);
            throw new Error('Invalid total_score: must be between 4-32');
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