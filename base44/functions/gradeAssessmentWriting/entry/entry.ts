import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

const LANGUAGE_NAMES = {
  finnish: 'Finnish',
  swedish: 'Swedish',
  danish: 'Danish',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check via shared function
    const rateLimitCheck = await base44.functions.invoke('checkAIRateLimit', {
      functionName: 'gradeAssessmentWriting',
    });
    if (rateLimitCheck.allowed === false) {
      return Response.json(
        { error: rateLimitCheck.message || 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { user_text, language, prompt_given } = await req.json();

    if (!user_text || !language || !prompt_given) {
      return Response.json(
        { error: 'Missing required fields: user_text, language, prompt_given' },
        { status: 400 }
      );
    }

    const languageName = LANGUAGE_NAMES[language] || language;

    const systemPrompt = `You are an expert CEFR language examiner specializing in ${languageName}. Your task is to assess the CEFR level (A1, A2, B1, or B2) of a short writing sample written in ${languageName}.

IMPORTANT: First check that the writing sample is actually written in ${languageName}. If it is written in a different language (e.g. English, another language), set recommended_level to "ERROR" and explain in reasoning that the response must be written in ${languageName}.

The user was given an open-ended prompt requiring no minimum language difficulty, so any level of response is valid. An A1 user might write 2-3 simple sentences; a B2 user might write a complex, nuanced paragraph.

Assess based on:
- Vocabulary range and accuracy
- Sentence structure complexity
- Grammatical accuracy
- Coherence and cohesion

Output ONLY valid JSON with exactly these fields:
{
  "recommended_level": "A1" | "A2" | "B1" | "B2" | "ERROR",
  "reasoning": "1-2 sentences in English explaining the level, referencing vocabulary, sentence structure, and grammatical accuracy. If ERROR, explain that the response must be written in ${languageName}."
}`;

    const userMessage = `Language: ${languageName}
Prompt given to user: "${prompt_given}"
User's writing sample:
"${user_text}"`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let raw_ai_response = '';
    let recommended_level = 'A1';
    let reasoning = '';

    try {
      const completion = await openai.chat.completions.create(
        {
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.3,
        },
        { signal: controller.signal }
      );

      raw_ai_response = completion.choices[0].message.content || '';
      const parsed = JSON.parse(raw_ai_response);
      recommended_level = parsed.recommended_level;
      reasoning = parsed.reasoning;
    } finally {
      clearTimeout(timeout);
    }

    // Log AI usage
    await base44.asServiceRole.entities.AIUsageLog.create({
      function_name: 'gradeAssessmentWriting',
      user_email: user.email,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ recommended_level, reasoning, raw_ai_response });
  } catch (error) {
    console.error('gradeAssessmentWriting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});