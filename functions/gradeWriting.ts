import { createClient } from 'npm:@base44/sdk@0.1.0';

const callOpenAI = async (prompt, responseSchema, timeout = 45000) => {
// ... keep existing code (callOpenAI function) ...
};

Deno.serve(async (req) => {
// ... keep existing code (CORS and initial setup) ...

    try {
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        
// ... keep existing code (auth logic) ...
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }

        const { task, userResponse, difficulty, language } = await req.json();
        
        if (!task || !userResponse || !difficulty || !language) {
            return new Response(JSON.stringify({ 
                error: 'Missing required parameters: task, userResponse, difficulty, language' 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';
        
        const prompt = `You are an expert YKI ${languageName} writing evaluator at the ${difficulty} CEFR level.

Task: "${task.prompt}"
Student's response: "${userResponse}"

Evaluate the student's response based on the task and level. Provide your feedback ONLY in the following JSON format:

{
  "scores": {
    "task_fulfillment": <1-8, how well they completed the task>,
    "coherence_cohesion": <1-8, structure and flow>, 
    "vocabulary_range": <1-8, word choice and idiomatic language>,
    "grammatical_accuracy": <1-8, grammar and spelling>
  },
  "total_score": <4-32, sum of scores>,
  "feedback": {
    "strengths": "Provide a concise, 1-2 sentence summary of what the student did well, focusing on positive reinforcement.",
    "weaknesses": "Provide a concise, 1-2 sentence summary of the main areas for improvement. Then, on a new line, add a 'Focus Areas' section with a bulleted list of 2-3 specific, actionable topics the student should work on (e.g., \\n\\n**Focus Areas:**\\n- Use of conjunctions to connect ideas\\n- Review past tense verb conjugations\\n- Sentence structure variety)."
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