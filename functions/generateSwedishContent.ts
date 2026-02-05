import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SWEDISH_TOPICS = [
  "Fika culture and Swedish coffee traditions",
  "Allemansrätten - Right of public access to nature",
  "Swedish healthcare system (vårdcentralen)",
  "Housing in Sweden (bostadsrätt vs hyresrätt)",
  "Midsommar celebrations",
  "Swedish education system",
  "Gender equality in Sweden",
  "Swedish work-life balance (lagom)",
  "Environmental consciousness and recycling",
  "Swedish welfare state",
  "Immigration and integration",
  "Swedish workplace culture",
  "Public transportation in Sweden",
  "Swedish holidays and traditions"
];

const PROMPT_TEMPLATES = {
  reading: (level, topic, wordCount) => `Generate a Swedish reading comprehension text for CEFR level ${level}.

Topic: ${topic}
Word count: ${wordCount} words
Cultural context: Include authentic Swedish cultural references where appropriate.

The text should:
- Use vocabulary appropriate for ${level} level
- Reflect Swedish society and culture naturally
- Be engaging and informative
- Include 5 comprehension questions (multiple choice with 4 options each)

Return ONLY valid JSON in this exact format:
{
  "text": "The Swedish reading text...",
  "questions": [
    {
      "question": "Question text?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`,

  writing: (level, taskType) => `Generate TWO Swedish writing tasks for CEFR level ${level}.

Task type: ${taskType}
Cultural context: Swedish society

Create two writing prompts that:
- Are appropriate for ${level} level
- Reflect Swedish cultural contexts (work, education, daily life)
- Include clear instructions in Swedish
- Specify word count requirements
- Provide context and scenario

Return ONLY valid JSON in this exact format:
{
  "tasks": [
    {
      "task_type": "Informal Message",
      "prompt": "The task instructions in Swedish...",
      "word_count": "150-200 words",
      "sample_answer": "Example response...",
      "assessment_criteria": {
        "task_fulfillment": "...",
        "language_sophistication": "...",
        "grammatical_accuracy": "..."
      }
    },
    {
      "task_type": "Formal Message",
      "prompt": "The task instructions in Swedish...",
      "word_count": "200-250 words",
      "sample_answer": "Example response...",
      "assessment_criteria": {
        "task_fulfillment": "...",
        "language_sophistication": "...",
        "grammatical_accuracy": "..."
      }
    }
  ]
}`,

  speaking: (level) => `Generate TWO Swedish speaking tasks for CEFR level ${level}.

Create speaking prompts that:
- Are appropriate for ${level} level
- Include realistic Swedish scenarios
- Have clear instructions in Swedish
- Provide varied task types

Return ONLY valid JSON in this exact format:
{
  "tasks": [
    {
      "task_type": "Situational Response",
      "prompt": "Speaking task description in Swedish...",
      "time_limit": "30 seconds",
      "sample_answer": "Example response in Swedish...",
      "assessment": "Assessment criteria..."
    },
    {
      "task_type": "Monologue",
      "prompt": "Speaking task description in Swedish...",
      "time_limit": "90 seconds",
      "sample_answer": "Example response in Swedish...",
      "assessment": "Assessment criteria..."
    }
  ]
}`,

  listening: (level, wordCount) => `Generate a Swedish listening comprehension scenario for CEFR level ${level}.

Create:
- A realistic Swedish dialogue or monologue (${wordCount} words)
- 5 comprehension questions (multiple choice)
- Appropriate for ${level} level
- Include Swedish cultural context

Return ONLY valid JSON in this exact format:
{
  "scenario_description": "Brief description...",
  "audio_script": "The Swedish dialogue/monologue text...",
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
            content: 'You are an expert Swedish language teacher creating exam content for CEFR-based Swedish proficiency tests (Swedex/SFI). Always respond with valid JSON only.'
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
    const selectedTopic = topic || SWEDISH_TOPICS[Math.floor(Math.random() * SWEDISH_TOPICS.length)];

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

    // Validate the response structure
    if (section === 'reading' || section === 'listening') {
      if (!content.questions || !Array.isArray(content.questions)) {
        throw new Error(`Invalid ${section} content: missing questions array`);
      }
    } else if (section === 'writing' || section === 'speaking') {
      if (!content.tasks || !Array.isArray(content.tasks)) {
        throw new Error(`Invalid ${section} content: missing tasks array`);
      }
    }

    return Response.json({
      ...content,
      language: 'swedish',
      difficulty: level,
      topic: selectedTopic
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error generating Swedish content:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate content' 
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});