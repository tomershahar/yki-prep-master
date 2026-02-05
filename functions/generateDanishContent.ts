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
      "question_type": "multiple_choice",
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option 1",
      "explanation": "Why this is correct"
    }
  ]
}`,

  writing: (level, taskType) => `Generate TWO Danish writing tasks for CEFR level ${level} (PD3 exam).

Task type: ${taskType}
Cultural context: Danish society

Create two writing prompts that:
- Are appropriate for PD3 (B2 level)
- Reflect Danish cultural contexts (work, education, daily life)
- Include clear instructions in Danish
- Specify word count requirements
- Provide realistic scenarios

Return ONLY valid JSON in this exact format:
{
  "tasks": [
    {
      "task_type": "Informal Message",
      "prompt": "The task instructions in Danish...",
      "word_count": "150-200 words",
      "time_limit": "30 minutes",
      "sample_answer": "Example response...",
      "comments": "Assessment notes..."
    },
    {
      "task_type": "Formal Message",
      "prompt": "The task instructions in Danish...",
      "word_count": "200-250 words",
      "time_limit": "45 minutes",
      "sample_answer": "Example response...",
      "comments": "Assessment notes..."
    }
  ]
}`,

  speaking: (level) => `Generate TWO Danish speaking tasks for CEFR level ${level} (PD3 exam).

Create speaking prompts that:
- Are appropriate for PD3 (B2 level)
- Include realistic Danish scenarios
- Have clear instructions in Danish
- Provide varied task types

Return ONLY valid JSON in this exact format:
{
  "tasks": [
    {
      "task_type": "Situational Response",
      "prompt": "Speaking task description in Danish...",
      "time_limit": "30 seconds",
      "sample_answer": "Example response in Danish...",
      "assessment": "Assessment criteria..."
    },
    {
      "task_type": "Monologue",
      "prompt": "Speaking task description in Danish...",
      "time_limit": "90 seconds",
      "sample_answer": "Example response in Danish...",
      "assessment": "Assessment criteria..."
    }
  ]
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
      "question_type": "multiple_choice",
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correct_answer": "Option 1",
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
    
    console.log('Danish content generated:', JSON.stringify(content).substring(0, 200));

    // Validate the content structure
    if (!content) {
      throw new Error('No content generated from OpenAI');
    }

    // Ensure the content has the required fields
    if (section === 'reading' || section === 'listening') {
      if (!content.questions || !Array.isArray(content.questions) || content.questions.length === 0) {
        throw new Error(`Invalid ${section} content: missing questions array`);
      }
      
      // CRITICAL FIX: Ensure all questions have question_type set to multiple_choice
      content.questions = content.questions.map(q => ({
        ...q,
        question_type: 'multiple_choice' // Force this field for all Danish questions
      }));
    } else if (section === 'writing' || section === 'speaking') {
      if (!content.tasks || !Array.isArray(content.tasks) || content.tasks.length === 0) {
        throw new Error(`Invalid ${section} content: missing tasks array`);
      }
    }

    // Return with additional metadata
    return Response.json({
      ...content,
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