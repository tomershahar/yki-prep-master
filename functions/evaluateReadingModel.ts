import { createClient } from 'npm:@base44/sdk@0.1.0';

// Cache KnowledgeBase files to reduce API calls
let cachedFileUrls = null;

async function getKnowledgeBaseFiles(base44Client) {
  if (cachedFileUrls) {
    return cachedFileUrls;
  }
  const knowledgeFiles = await base44Client.entities.KnowledgeBaseContent.list();
  cachedFileUrls = knowledgeFiles.map(file => file.file_url);
  return cachedFileUrls;
}

const callOpenAI = async (prompt, responseSchema = null, timeout = 45000) => {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
        throw new Error("OpenAI API key not found");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const requestBody = {
            model: "gpt-4o", // UPGRADED
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that responds with valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
        };

        if (responseSchema) {
            requestBody.response_format = { type: "json_object" };
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        return responseSchema ? JSON.parse(content) : content;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    }
};

// This is the EXACT same function that generates reading content for users
const generateReadingContent = async (language, difficulty, fileUrls) => {
    const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';
    
    // OPTIMIZED PROMPT - shorter and more focused
    const prompt = `You are a YKI Reading Practice Generator for ${difficulty} level learners in ${languageName}.

CRITICAL: Use diverse, engaging topics. DO NOT repeat common themes like weekends, holidays, or typical daily routines. Choose from varied subjects:
- Technology and innovation
- Environmental issues
- Cultural traditions and festivals
- Health and sports
- Arts and entertainment
- Education systems
- Work and professional life
- Food culture and cuisine
- Urban planning and architecture
- Social issues
- Science and nature
- Historical events or figures

Generate:
1. A reading passage in ${languageName} (CEFR ${difficulty} level):
   - A1: 100–150 words | A2: 150–200 | B1: 150–200 | B2: 200–250
   - Select ONE specific topic from the diverse list above
   - Content should be interesting, culturally relevant, and use appropriate vocabulary/grammar

2. 5 multiple-choice questions (in ${languageName}) that test comprehension:
   - Use this JSON format:
{
  "text": "...",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "...",
      "explanation": "..."
    }
  ]
}
- At least 3 questions must require inference or reasoning (not just recall).`;

    return await callOpenAI(prompt, true, 30000);
};

// Assessment function that users actually experience
const assessReadingAnswers = async (readingContent, userAnswers, difficulty) => {
    const knowledgeFiles = await (createClient({ appId: Deno.env.get('BASE44_APP_ID') })).entities.KnowledgeBaseContent.list();
    const fileUrls = knowledgeFiles.map(file => file.file_url);

    const prompt = `You are an expert YKI reading comprehension evaluator. Assess this user's performance on a ${difficulty} level reading exercise.

Reading Text: "${readingContent.text}"

User's Answers:
${userAnswers.map((ans, idx) => `Question ${idx + 1}: "${ans.question}"
User Answer: "${ans.user_answer}"
Correct Answer: "${ans.correct_answer}"
Was Correct: ${ans.is_correct}`).join('\n\n')}

Total Correct: ${userAnswers.filter(a => a.is_correct).length}/${userAnswers.length}

Evaluate the user's comprehension level and provide feedback:

{
  "comprehension_score": <0-100>,
  "correct_answers": ${userAnswers.filter(a => a.is_correct).length},
  "total_questions": ${userAnswers.length},
  "cefr_level": "<Estimated CEFR level: A2, B1.1, B1.2, or B2>",
  "feedback": {
    "strengths": "What the user demonstrated well",
    "weaknesses": "Areas needing improvement"
  }
}`;

    return await callOpenAI(prompt, true);
};

// Simulate realistic answer sets for different performance levels
const simulateUserAnswers = (questions, difficulty) => {
    const createAnswers = (correctCount, description) => {
        return questions.map((q, idx) => ({
            question: q.question,
            user_answer: idx < correctCount ? q.correct_answer : (q.options ? q.options[0] : "Wrong answer"),
            correct_answer: q.correct_answer,
            is_correct: idx < correctCount,
            has_explanation: !!q.explanation,
            description
        }));
    };

    // Adjust expectations based on difficulty level
    const expectations = {
        'A1': { below: 1, at: 2, above: 4 },
        'A2': { below: 1, at: 3, above: 4 },
        'B1': { below: 2, at: 3, above: 5 },
        'B2': { below: 2, at: 4, above: 5 }
    };

    const levels = expectations[difficulty] || expectations['B1'];

    return {
        below_level: createAnswers(levels.below, `Below ${difficulty} level performance`),
        at_level: createAnswers(levels.at, `At ${difficulty} level performance`),
        above_level: createAnswers(levels.above, `Above ${difficulty} level performance`)
    };
};

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response('Access denied', { status: 403, headers: corsHeaders });
        }

        const { language, difficulty } = await req.json();

        // Step 1: Get knowledge base files using cache
        const fileUrls = await getKnowledgeBaseFiles(base44);

        // Step 2: Generate reading content using the EXACT same function users experience
        const generatedContent = await generateReadingContent(language, difficulty, fileUrls);

        // Step 3: Simulate realistic user answer sets
        const simulatedAnswers = simulateUserAnswers(generatedContent.questions || [], difficulty);

        // Step 4: PARALLELIZE AI assessment calls for better performance
        const entries = Object.entries(simulatedAnswers);
        
        const assessments = await Promise.all(entries.map(([levelName, answers]) =>
            assessReadingAnswers(generatedContent, answers, difficulty)
                .then(result => ({ levelName, result }))
                .catch(error => ({ levelName, error }))
        ));

        const assessmentResults = {};
        assessments.forEach(({ levelName, result, error }) => {
            if (error) {
                console.error(`Assessment failed for ${levelName}:`, error);
                assessmentResults[levelName] = {
                    comprehension_score: 0,
                    cefr_level: "N/A",
                    feedback: { strengths: "Assessment failed", weaknesses: error.message },
                    expected_range: levelName,
                    error: error.message
                };
            } else {
                assessmentResults[levelName] = {
                    ...result,
                    expected_range: levelName,
                    test_answers: simulatedAnswers[levelName]
                };
            }
        });

        // Step 5: Define expected CEFR levels for validation
        const expectedLevels = {
            below_level: ["A2", "B1.1"],
            at_level: ["B1.1", "B1.2", difficulty], // Include target difficulty
            above_level: ["B1.2", "B2"]
        };

        // Step 6: Validate assessment accuracy
        const evalAccuracy = (result, expected) => {
            return expected.includes(result.cefr_level);
        };

        const agentAccuracyEval = {};
        for (const [levelName, result] of Object.entries(assessmentResults)) {
            const expected = expectedLevels[levelName] || [];
            agentAccuracyEval[levelName] = {
                expected: expected.join(' or '),
                actual: result.cefr_level,
                match: evalAccuracy(result, expected),
                score: result.comprehension_score,
                full_result: result
            };
        }

        // Step 7: Evaluate the generated content quality
        const evaluationPrompt = `Evaluate this AI-generated YKI reading content for ${difficulty} level in ${language === 'finnish' ? 'Finnish' : 'Swedish'}.

Generated Content Summary:
- Text length: ${generatedContent.text?.length || 0} characters
- Number of questions: ${generatedContent.questions?.length || 0}
- Questions have explanations: ${generatedContent.questions?.filter(q => q.explanation).length || 0}/${generatedContent.questions?.length || 0}

Assessment Agent Results:
- Below Level Test: Expected ${agentAccuracyEval.below_level.expected}, Got ${agentAccuracyEval.below_level.actual} (${agentAccuracyEval.below_level.match ? 'PASS' : 'FAIL'})
- At Level Test: Expected ${agentAccuracyEval.at_level.expected}, Got ${agentAccuracyEval.at_level.actual} (${agentAccuracyEval.at_level.match ? 'PASS' : 'FAIL'})
- Above Level Test: Expected ${agentAccuracyEval.above_level.expected}, Got ${agentAccuracyEval.above_level.actual} (${agentAccuracyEval.above_level.match ? 'PASS' : 'FAIL'})

Evaluate based on these criteria:
1. **Level Accuracy**: Is the text appropriate for ${difficulty} level?
2. **Grammar & Vocabulary**: Is the language natural and correct?
3. **Question Quality**: Are the questions clear and test comprehension well?
4. **Assessment Agent Accuracy**: How well did the AI assess different performance levels?

Provide your evaluation as JSON:
{
  "overall_score": <0-100 integer>,
  "level_accuracy": {
    "score": <0-100 integer>,
    "assessment": "Assessment of how well the content matches ${difficulty} level"
  },
  "grammar_vocabulary": {
    "score": <0-100 integer>,
    "assessment": "Assessment of language quality and naturalness"
  },
  "question_quality": {
    "score": <0-100 integer>,
    "assessment": "Assessment of question clarity and comprehension testing"
  },
  "assessment_accuracy": {
    "score": <0-100 integer>,
    "assessment": "How accurately the AI assessment agent evaluated different performance levels"
  },
  "summary": {
    "strengths": "What the AI did well",
    "weaknesses": "Areas for improvement", 
    "final_verdict": "Overall assessment of content quality and assessment accuracy"
  },
  "recommendations": "Specific suggestions for improvement",
  "improved_prompt": "Complete improved version of the generation prompt"
}`;

        const evaluation = await callOpenAI(evaluationPrompt, true, 30000);

        // Helper function to ensure value is a string
        const ensureString = (value) => {
            if (typeof value === 'string') return value;
            if (Array.isArray(value)) return value.join('\n');
            if (value === null || value === undefined) return '';
            return String(value);
        };

        // Step 8: Save the evaluation report
        const reportPayload = {
            model_type: "reading",
            difficulty_level: difficulty,
            language: language,
            score: evaluation.overall_score || 0,
            report_summary: {
                strengths: ensureString(evaluation.summary?.strengths),
                weaknesses: ensureString(evaluation.summary?.weaknesses),
                final_verdict: ensureString(evaluation.summary?.final_verdict)
            },
            detailed_breakdown: {
                level_accuracy: {
                    score: evaluation.level_accuracy?.score || 0,
                    assessment: ensureString(evaluation.level_accuracy?.assessment)
                },
                grammar_vocabulary: {
                    score: evaluation.grammar_vocabulary?.score || 0,
                    assessment: ensureString(evaluation.grammar_vocabulary?.assessment)
                },
                question_quality: {
                    score: evaluation.question_quality?.score || 0,
                    assessment: ensureString(evaluation.question_quality?.assessment)
                },
                assessment_accuracy: {
                    score: evaluation.assessment_accuracy?.score || 0,
                    assessment: ensureString(evaluation.assessment_accuracy?.assessment)
                }
            },
            recommendations: ensureString(evaluation.recommendations),
            improved_prompt: ensureString(evaluation.improved_prompt),
            agent_accuracy_eval: agentAccuracyEval,
            generated_content: {
                content: generatedContent,
                simulated_tests: simulatedAnswers,
                assessment_results: assessmentResults,
                evaluation: evaluation
            }
        };

        const report = await base44.entities.EvaluationReport.create(reportPayload);

        return new Response(JSON.stringify(report), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (error) {
        console.error("Reading evaluation error:", error);
        return new Response(JSON.stringify({ 
            error: error.message,
            details: error.stack 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});