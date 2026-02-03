import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const DANISH_TOPICS = [
  "Hygge and Danish lifestyle",
  "Danish welfare system and flexicurity",
  "Cycling culture in Denmark",
  "Janteloven - The Law of Jante",
  "Danish education and SU system",
  "Work-life balance in Denmark",
  "Danish monarchy and democracy",
  "Environmental policies",
  "Housing cooperatives (andelsbolig)",
  "Danish food culture (smørrebrød, wienerbrød)",
  "Public transportation in Denmark",
  "Danish healthcare system",
  "Immigration and integration in Denmark",
  "Danish holidays and traditions"
];

const PROMPT_TEMPLATES = {
  reading: (level, topic, wordCount) => `Generate a Danish reading comprehension text for CEFR level ${level} (PD3 exam).

Topic: ${topic}
Word count: ${wordCount} words
Cultural context: Include authentic Danish cultural references.

The text should:
- Use vocabulary appropriate for ${level} level
- Reflect Danish society and culture naturally
- Be engaging and informative
- Include 5 comprehension questions (multiple choice with 4 options each)

Return ONLY valid JSON in this exact format:
{
  "text": "The Danish reading text...",
  "questions": [
    {
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`,

  writing: (level, taskType) => `Generate a Danish writing task for CEFR level ${level} (PD3 exam).

Task type: ${taskType}
Cultural context: Danish society

Create a writing prompt that:
- Is appropriate for PD3 (B2 level)
- Reflects Danish cultural contexts (work, education, daily life)
- Includes clear instructions in Danish
- Specifies word count requirements
- Provides realistic scenario

Return ONLY valid JSON in this exact format:
{
  "task_type": "${taskType}",
  "prompt": "The task instructions in Danish...",
  "word_count": "200-250 words",
  "time_limit": "75 minutes",
  "sample_answer": "Example response...",
  "comments": "Assessment notes..."
}`,

  speaking: (level) => `Generate a Danish speaking task for CEFR level ${level} (PD3 exam).

Create a speaking prompt that:
- Is appropriate for PD3 (B2 level)
- Includes a realistic Danish scenario
- Has clear instructions in Danish
- Provides context for 2-minute presentation plus conversation

Return ONLY valid JSON in this exact format:
{
  "task_type": "presentation",
  "prompt": "Speaking task description in Danish...",
  "time_limit": "2 minutes presentation + conversation",
  "follow_up_questions": ["Question 1?", "Question 2?", "Question 3?"]
}`,

  listening: (level, wordCount) => `Generate a Danish listening comprehension scenario for CEFR level ${level} (PD3 exam).

Create:
- A realistic Danish dialogue or monologue (${wordCount} words)
- 5 comprehension questions (multiple choice)
- Appropriate for B2 level
- Include Danish cultural context

Return ONLY valid JSON in this exact format:
{
  "scenario_description": "Brief description...",
  "audio_script": "The Danish dialogue/monologue text...",
  "questions": [
    {
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`
};

async function callOpenAI(prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Danish language teacher creating exam content for Prøve i Dansk 3 (PD3). Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
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
      throw new Error('OpenAI API request timeout');
    }
    throw error;
  }
}

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

    if (!OPENAI_API_KEY) {
      return Response.json({ error: 'OpenAI API key not configured' }, { status: 500, headers: corsHeaders });
    }

    const { section, level, topic, wordCount, taskType } = await req.json();

    if (!section || !level) {
      return Response.json({ error: 'Missing required fields: section, level' }, { status: 400, headers: corsHeaders });
    }

    // Get random topic if not provided
    const selectedTopic = topic || DANISH_TOPICS[Math.floor(Math.random() * DANISH_TOPICS.length)];

    // Generate prompt based on section
    let prompt;
    switch (section) {
      case 'reading':
        prompt = PROMPT_TEMPLATES.reading(level, selectedTopic, wordCount || 300);
        break;
      case 'writing':
        prompt = PROMPT_TEMPLATES.writing(level, taskType || 'email');
        break;
      case 'speaking':
        prompt = PROMPT_TEMPLATES.speaking(level);
        break;
      case 'listening':
        prompt = PROMPT_TEMPLATES.listening(level, wordCount || 200);
        break;
      default:
        return Response.json({ error: `Unknown section: ${section}` }, { status: 400, headers: corsHeaders });
    }

    const content = await callOpenAI(prompt);

    // Ensure writing and speaking content is wrapped in a tasks array
    let responseContent = { ...content };
    if ((section === 'writing' || section === 'speaking') && !responseContent.tasks) {
      // If it's a single task object, wrap it in tasks array
      responseContent = { tasks: [responseContent] };
    }

    return Response.json({
      ...responseContent,
      language: 'danish',
      difficulty: level,
      topic: selectedTopic
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error generating Danish content:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate content' 
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});