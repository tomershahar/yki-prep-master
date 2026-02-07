import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai@4.73.1';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { section, level, language, situation } = await req.json();

    if (!section || !level || !language) {
      return Response.json(
        { error: 'Missing required parameters: section, level, language' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Parse situation if provided
    let parsedSituation = null;
    if (situation) {
      try {
        parsedSituation = typeof situation === 'string' ? JSON.parse(situation) : situation;
      } catch (e) {
        console.error('Failed to parse situation:', e);
      }
    }

    // Fetch knowledge base content for context
    const knowledgeBase = await base44.asServiceRole.entities.KnowledgeBaseContent.filter({
      test_name: 'YKI',
      country_code: 'FI'
    });

    let knowledgeContext = '';
    if (knowledgeBase && knowledgeBase.length > 0) {
      knowledgeContext = '\n\nKNOWLEDGE BASE CONTEXT:\n';
      for (const doc of knowledgeBase) {
        knowledgeContext += `- ${doc.description || doc.file_name}\n`;
      }
    }

    const systemPrompt = getSystemPrompt(section, level, knowledgeContext, parsedSituation);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = JSON.parse(completion.choices[0].message.content);

    return Response.json(content, { headers: corsHeaders });

  } catch (error) {
    console.error('Error generating Finnish content:', error);
    return Response.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500, headers: corsHeaders }
    );
  }
});

function getSystemPrompt(section, level, knowledgeContext, situation = null) {
  const baseInstruction = `You are a YKI (Finnish National Certificate of Language Proficiency) Practice Generator. Your task is to generate high-quality practice content for CEFR level ${level} in Finnish. Ensure all content is culturally relevant, natural, and grammatically correct. Respond ONLY with valid JSON.${knowledgeContext}`;

  switch (section) {
    case 'reading':
      return `${baseInstruction}

TASK: Create a complete reading comprehension exercise for level ${level} in Finnish.

INSTRUCTIONS:
1. Generate a short reading text ENTIRELY in Finnish.
   - Topic must be culturally relevant for adult learners in Finland
   - USE DIVERSE TOPICS: work, daily life, education, culture, nature, technology, food, travel, government, hobbies
   - AVOID repeating the same topic - vary themes

2. Match CEFR level expectations:
   - A1: 100–120 words. Very simple vocabulary. Basic sentence structures.
   - A2: 150–180 words. Simple vocabulary, some thematic terms. Compound sentences.
   - B1: 180–220 words. Compound and complex sentences. Include reasoning and opinions.
   - B2: 220–250 words. Complex structures, subordinate clauses, passive voice, abstract vocabulary.

3. Generate **5 multiple-choice questions** in Finnish.
   - At least 3 must test inference or interpretation, not just recall.

4. Return valid JSON:
{
  "text": "Reading passage in Finnish",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question": "Question in Finnish",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Option A",
      "explanation": "Explanation in Finnish"
    }
  ]
}`;

    case 'listening':
      return `${baseInstruction}

TASK: Create a complete listening comprehension exercise for level ${level} in Finnish.

INSTRUCTIONS:
1. Generate a short audio script (150-200 words) for a single speaker ENTIRELY in Finnish.
   - USE VARIED REALISTIC SCENARIOS: news reports, personal stories, announcements, phone messages, podcasts, instructions, interviews, advertisements

2. Match CEFR level expectations for spoken language.

3. Generate **4-6 multiple-choice questions** in Finnish.

4. Return valid JSON:
{
  "audio_script": "Script in Finnish",
  "scenario_description": "Context in Finnish",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question": "Question in Finnish",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "Correct option",
      "explanation": "Explanation in Finnish"
    }
  ]
}`;

    case 'writing':
      return `${baseInstruction}

TASK: Create two distinct writing tasks for level ${level} in Finnish.

INSTRUCTIONS:
1. Generate two tasks with VARIED TOPICS:
   - Task 1: Informal Message (email to friend, text message, social media post, note)
   - Task 2: Formal Message (official email, letter, opinion piece, report)
   - SELECT DIFFERENT THEMES: work, education, health, environment, culture, technology

2. Match CEFR word counts:
   - A1: 30-50 words per task
   - A2: 40-60 words per task
   - B1: 60-100 words per task
   - B2: 80-120 words per task

3. Return valid JSON:
{
  "tasks": [
    {
      "task_type": "Informal Message",
      "prompt": "Prompt in Finnish",
      "word_count": "30-50 words",
      "sample_answer": "Example in Finnish",
      "assessment_criteria": {
        "task_fulfillment": "...",
        "language_sophistication": "...",
        "grammatical_accuracy": "..."
      }
    },
    {
      "task_type": "Formal Message",
      "prompt": "Prompt in Finnish",
      "word_count": "80-120 words",
      "sample_answer": "Example in Finnish",
      "assessment_criteria": {
        "task_fulfillment": "...",
        "language_sophistication": "...",
        "grammatical_accuracy": "..."
      }
    }
  ]
}`;

    case 'speaking':
      if (situation) {
        return `${baseInstruction}

TASK: Create two distinct speaking tasks for level ${level} in Finnish.

**SITUATIONAL CONTEXT:**
- Situation: ${situation.title}
- Context: ${situation.context}
- Key Phrases to naturally incorporate: ${situation.key_phrases?.join(', ')}
- Expected Elements to cover: ${situation.expected_elements?.join(', ')}
- Category: ${situation.category}

**INSTRUCTIONS:**
1. Create tasks that are specifically relevant to this real-life situation
2. The prompts should naturally lead the student to use the key phrases
3. Design tasks that require covering the expected elements
4. Ensure the scenario and language are appropriate for the situation context
5. Make it realistic - as if this situation could actually happen in Finland
6. Match CEFR level ${level} expectations

3. Return valid JSON:
{
  "tasks": [
    {
      "task_type": "Situational Response",
      "prompt": "Prompt in Finnish (specific to the situation)",
      "sample_answer": "Example in Finnish",
      "assessment": "Criteria in Finnish",
      "time_limit": "30 seconds"
    },
    {
      "task_type": "Monologue",
      "prompt": "Extended prompt in Finnish (related to situation)",
      "sample_answer": "Example in Finnish",
      "assessment": "Criteria in Finnish",
      "time_limit": "90 seconds"
    }
  ]
}`;
      }
      
      return `${baseInstruction}

TASK: Create two distinct speaking tasks for level ${level} in Finnish.

INSTRUCTIONS:
1. Generate two tasks with DIVERSE PROMPTS:
   - Task 1: Situational Response (~30 seconds) - introduce yourself, give directions, make phone call, respond to invitation, handle situation
   - Task 2: Monologue/Description (1-2 minutes) - describe place/routine, narrate experience, explain hobby/tradition, compare topics, give opinion
   - USE FRESH TOPICS: work, family, travel, hobbies, culture, education, environment

2. Match CEFR expectations:
   - A1: Simple personal questions
   - A2: Basic descriptions and opinions
   - B1: Narrating experiences with reasoning
   - B2: Discussing abstract topics with detail

3. Return valid JSON:
{
  "tasks": [
    {
      "task_type": "Situational Response",
      "prompt": "Prompt in Finnish",
      "sample_answer": "Example in Finnish",
      "assessment": "Criteria in Finnish",
      "time_limit": "30 seconds"
    },
    {
      "task_type": "Monologue",
      "prompt": "Prompt in Finnish",
      "sample_answer": "Example in Finnish",
      "assessment": "Criteria in Finnish",
      "time_limit": "90 seconds"
    }
  ]
}`;

    default:
      return baseInstruction;
  }
}