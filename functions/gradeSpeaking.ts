import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const callOpenAI = async (prompt, responseSchema, timeout = 45000) => {
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
                model: "gpt-4o", // Using gpt-4o for detailed feedback
                messages: [
                    {
                       role: "system",
                       content: "You are an expert language proficiency speaking evaluator (YKI/Swedex/PD3) providing detailed, actionable feedback. Respond with valid JSON only."
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
            throw new Error('AI grading timeout (45s)');
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
            functionName: 'gradeSpeaking' 
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

        const { task, userTranscription, difficulty, language, testType } = await req.json();
        
        if (!task || !userTranscription || !difficulty || !language) {
            return new Response(JSON.stringify({ 
                error: 'Missing required parameters: task, userTranscription, difficulty, language' 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const languageMap = {
            'finnish': 'Finnish',
            'swedish': 'Swedish',
            'danish': 'Danish'
        };
        const languageName = languageMap[language] || 'Finnish';
        const testName = testType || 'YKI';
        
        const prompt = `Evaluate this ${testName} ${languageName} speaking response at level ${difficulty}.

Task: "${task.prompt}"
Student response (transcribed): "${userTranscription}"

Provide comprehensive, detailed evaluation in the following JSON format:

{
  "scores": {
    "communicative_ability": <1-8, clarity and effectiveness>,
    "coherence": <1-8, logical flow and organization>, 
    "vocabulary": <1-8, range and appropriateness>,
    "grammar": <1-8, accuracy and complexity>
  },
  "total_score": <4-32, sum of scores>,
  "feedback": {
    "strengths": "2-3 sentences highlighting what the student did well with specific examples from their speech.",
    "weaknesses": "2-3 sentences explaining main areas for improvement with specific examples.",
    "fluency_analysis": "Detailed analysis of speech flow: comment on hesitations, filler words, sentence completion, natural rhythm. Note any repetitions or reformulations. Suggest 2-3 specific fluency exercises.",
    "pronunciation_notes": "Based on the transcription quality and word choices, identify potential pronunciation challenges for this CEFR level in ${languageName}. Suggest 3-4 specific sounds, words, or patterns to practice (e.g., 'double consonants in Finnish', 'Swedish pitch accent', 'long vs short vowels').",
    "grammar_speaking": "Analyze grammar in spoken context: identify 2-3 patterns that need work, explain why they're important for natural speech, suggest practice drills.",
    "vocabulary_range": "Evaluate word choice: suggest 5-7 more sophisticated alternatives for basic words used, recommend vocabulary themes to expand, comment on idiomatic language use.",
    "structure_organization": "Assess how well ideas are organized and connected in speech. Suggest discourse markers and transition phrases to improve coherence.",
    "examples": "Give 2-3 concrete examples showing how to improve actual phrases from the response, with corrected versions.",
    "focus_areas": ["4-6 prioritized learning goals with brief explanations"],
    "practice_suggestions": "Provide 3-4 specific practice activities (e.g., 'Record yourself describing daily routines', 'Practice using temporal expressions', 'Shadow native speakers on news podcasts', 'Focus on question formation drills')"
  },
  "cefr_level": "<A1/A2/B1/B2>"
}`;

        console.log(`Grading speaking task for user ${user.email}, difficulty: ${difficulty}, text length: ${userTranscription.length}`);

        const result = await callOpenAI(prompt, null, 45000);

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