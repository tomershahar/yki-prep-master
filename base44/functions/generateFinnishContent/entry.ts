import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
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

    const { section, level: rawLevel, language, situation } = await req.json();
    const ykiToCefr = { '1': 'A1', '2': 'A2', '3': 'B1', '4': 'B2', '5': 'C1', '6': 'C2' };
    const level = ykiToCefr[rawLevel] || rawLevel;

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

    // For reading, make 2 parallel calls (2 texts each) and merge to get 4 texts total
    if (section === 'reading') {
      const [batch1, batch2] = await Promise.all([
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: getReadingPrompt(level, knowledgeContext, 1) }],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
        openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: getReadingPrompt(level, knowledgeContext, 2) }],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      ]);

      const content1 = JSON.parse(batch1.choices[0].message.content);
      const content2 = JSON.parse(batch2.choices[0].message.content);

      // Rename parts from batch2 to avoid title conflicts, then merge
      const parts2 = (content2.parts || []).map((p, i) => ({
        ...p,
        title: `Teksti ${(content1.parts || []).length + i + 1}`
      }));

      return Response.json({ parts: [...(content1.parts || []), ...parts2] }, { headers: corsHeaders });
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

function getReadingPrompt(level, knowledgeContext, batch) {
  const baseInstruction = `You are a YKI (Finnish National Certificate of Language Proficiency) Practice Generator. Your task is to generate high-quality practice content for CEFR level ${level} in Finnish. Ensure all content is culturally relevant, natural, and grammatically correct. Respond ONLY with valid JSON.${knowledgeContext}`;
  
  const topicSets = {
    1: ['work', 'daily life', 'nature', 'food'],
    2: ['education', 'culture', 'technology', 'travel']
  };
  const topics = topicSets[batch] || topicSets[1];

  const textLengths = {
    A1: ['60-80', '80-100'],
    A2: ['80-100', '100-130'],
    B1: ['120-150', '150-180'],
    B2: ['150-180', '180-220'],
  };
  const [len1, len2] = textLengths[level] || ['80-100', '100-130'];

  const titleOffset = batch === 1 ? 1 : 3;

  return `${baseInstruction}

TASK: Create 2 Finnish reading texts on topics from: ${topics.join(', ')}. Each text must cover a DIFFERENT topic.

- Teksti ${titleOffset} (easier): ${len1} words. Generate 3 MULTIPLE CHOICE questions only.
- Teksti ${titleOffset + 1} (harder): ${len2} words. Generate 2 multiple choice + 2 short_answer questions.

RULES:
- All content and questions in Finnish
- multiple_choice: 4 options (e.g. "A) teksti"), correct_answer is a SINGLE letter: "A", "B", "C", or "D"
- short_answer: correct_answer is a concise 2-5 word phrase in Finnish, NO options field

Return ONLY valid JSON:
{
  "parts": [
    {
      "title": "Teksti ${titleOffset}",
      "content": "Finnish passage...",
      "questions": [
        { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "A", "explanation": "..." }
      ]
    },
    {
      "title": "Teksti ${titleOffset + 1}",
      "content": "Finnish passage...",
      "questions": [
        { "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct_answer": "B", "explanation": "..." },
        { "question": "...", "correct_answer": "lyhyt vastaus", "explanation": "..." }
      ]
    }
  ]
}`;
}

function getSystemPrompt(section, level, knowledgeContext, situation = null) {
  const baseInstruction = `You are a YKI (Finnish National Certificate of Language Proficiency) Practice Generator. Your task is to generate high-quality practice content for CEFR level ${level} in Finnish. Ensure all content is culturally relevant, natural, and grammatically correct. Respond ONLY with valid JSON.${knowledgeContext}`;

  switch (section) {
    case 'reading':
      return getReadingPrompt(level, knowledgeContext, 1);

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

TASK: Create three distinct writing tasks for level ${level} in Finnish, matching the actual YKI exam structure.

INSTRUCTIONS:
1. Generate exactly three tasks:
   - Task 1: Informal Message (viesti ystävälle, tekstiviesti, sosiaalisen median viesti, muistilappu)
   - Task 2: Formal Message (virallinen sähköposti, kirje viranomaiselle, reklamaatio, hakemus)
   - Task 3: Opinion/Essay (mielipidekirjoitus, essee, argumentoiva teksti lehdelle tai foorumille)
   - SELECT DIFFERENT THEMES across tasks: work, education, health, environment, culture, technology

2. Match CEFR word counts:
   - A1: 20-40 words per task
   - A2: 40-60 words per task
   - B1: 60-100 words per task
   - B2: 100-150 words per task

3. Return valid JSON:
{
  "tasks": [
    {
      "task_type": "Informal Message",
      "prompt": "Prompt in Finnish",
      "word_count": "40-60 words",
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
      "word_count": "60-100 words",
      "sample_answer": "Example in Finnish",
      "assessment_criteria": {
        "task_fulfillment": "...",
        "language_sophistication": "...",
        "grammatical_accuracy": "..."
      }
    },
    {
      "task_type": "Opinion/Essay",
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
        // Handle both old and new format for multilingual fields
        const getLocalizedContent = (content) => {
          if (!content) return '';
          if (typeof content === 'string') return content;
          return content.finnish || content.swedish || '';
        };
        
        const getLocalizedArray = (content) => {
          if (!content) return [];
          if (Array.isArray(content)) return content;
          return content.finnish || content.swedish || [];
        };
        
        const title = getLocalizedContent(situation.title);
        const context = getLocalizedContent(situation.context);
        const keyPhrases = getLocalizedArray(situation.key_phrases);
        const expectedElements = getLocalizedArray(situation.expected_elements);
        
        return `${baseInstruction}

TASK: Create two distinct speaking tasks for level ${level} in Finnish.

**SITUATIONAL CONTEXT:**
- Situation: ${title}
- Context: ${context}
- Key Phrases to naturally incorporate: ${keyPhrases.join(', ')}
- Expected Elements to cover: ${expectedElements.join(', ')}
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