import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const LEVEL_DESCRIPTIONS = {
  A1: 'absolute beginner – very simple vocabulary, short sentences, everyday topics like greetings, numbers, colors, food',
  A2: 'elementary – basic vocabulary, simple sentences, familiar topics like shopping, family, daily routine, weather',
  B1: 'intermediate – moderate vocabulary, connected text, topics like travel, work, health, current events',
  B2: 'upper-intermediate – wide vocabulary, complex sentences, abstract topics, opinions, nuanced ideas',
};

const LANGUAGE_NAMES = { finnish: 'Finnish', swedish: 'Swedish', danish: 'Danish' };

const TTS_VOICE_MAP = {
  finnish: 'nova',
  swedish: 'shimmer',
  danish: 'shimmer',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { language, module, level, count = 5 } = await req.json();

    if (!language || !module || !level) {
      return Response.json({ error: 'language, module, and level are required' }, { status: 400 });
    }

    const langName = LANGUAGE_NAMES[language] || language;
    const levelDesc = LEVEL_DESCRIPTIONS[level] || level;

    const systemPrompt = `You are an expert ${langName} language teacher creating CEFR-aligned assessment questions. 
All passages, questions, and answer options must be written entirely in ${langName}.
Return only valid JSON.`;

    let userPrompt;
    if (module === 'reading') {
      userPrompt = `Generate ${count} reading comprehension question sets in ${langName} for CEFR level ${level} (${levelDesc}).

Each object must have:
- "passage": A ${level === 'A1' ? '3-4' : level === 'A2' ? '4-5' : level === 'B1' ? '5-7' : '6-8'} sentence reading passage written entirely in ${langName}, culturally authentic and appropriate for ${level}.
- "question": One comprehension question in ${langName} about the passage.
- "options": Array of exactly 4 answer options in ${langName}.
- "correct_answer": The correct option (must match one of the options exactly).

Vary the topics (e.g. daily life, nature, culture, work, health, transport). Keep difficulty strictly at ${level}.

Return JSON: { "questions": [ { "passage": "...", "question": "...", "options": ["...","...","...","..."], "correct_answer": "..." }, ... ] }`;
    } else {
      userPrompt = `Generate ${count} listening comprehension question sets in ${langName} for CEFR level ${level} (${levelDesc}).

Each object must have:
- "passage": A short audio script in ${langName} (${level === 'A1' ? '2-3' : level === 'A2' ? '3-4' : '4-6'} sentences), written as natural spoken dialogue or monologue. This will be converted to audio for the user to listen to.
- "question": One comprehension question in ${langName} about what was said.
- "options": Array of exactly 4 answer options in ${langName}.
- "correct_answer": The correct option (must match one of the options exactly).

Vary the contexts (e.g. phone calls, announcements, conversations, instructions). Keep difficulty strictly at ${level}.

Return JSON: { "questions": [ { "passage": "...", "question": "...", "options": ["...","...","...","..."], "correct_answer": "..." }, ... ] }`;
    }

    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const parsed = JSON.parse(aiResponse.choices[0].message.content);
    const questionsArr = parsed.questions || parsed;
    const questions = Array.isArray(questionsArr) ? questionsArr : Object.values(parsed)[0];

    const created = [];
    for (const q of questions) {
      let audio_url = null;

      if (module === 'listening' && q.passage) {
        try {
          const voice = TTS_VOICE_MAP[language] || 'nova';
          const ttsRes = await openai.audio.speech.create({
            model: 'tts-1',
            voice,
            input: q.passage,
          });
          const audioBuffer = await ttsRes.arrayBuffer();
          const audioFile = new File([audioBuffer], 'audio.mp3', { type: 'audio/mpeg' });
          const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file: audioFile });
          audio_url = uploadResult?.file_url || null;
        } catch (ttsErr) {
          console.error('TTS failed:', ttsErr.message);
        }
      }

      const record = await base44.asServiceRole.entities.AssessmentQuestion.create({
        module,
        level,
        language,
        passage: q.passage || null,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        ...(audio_url ? { audio_url } : {}),
      });
      created.push(record);
    }

    return Response.json({ success: true, created: created.length, questions: created });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});