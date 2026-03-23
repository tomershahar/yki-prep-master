
import { createClient } from 'npm:@base44/sdk@0.1.0';

const callOpenAI = async (prompt, responseSchema = null, timeout = 45000) => {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
        throw new Error("OpenAI API key not found");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const requestBody = {
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a helpful assistant that responds with valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
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

// Cache KnowledgeBase files to reduce API calls
let cachedFileUrls = null;

async function getKnowledgeBaseFiles(base44) { // base44 client needs to be passed or accessible
  if (cachedFileUrls) return cachedFileUrls;
  const knowledgeFiles = await base44.entities.KnowledgeBaseContent.list();
  cachedFileUrls = knowledgeFiles.map(file => file.file_url);
  return cachedFileUrls;
}

// Assessment function that users actually experience for listening
const assessListeningAnswers = async (listeningContent, userAnswers, difficulty) => {
    const prompt = `You are an expert YKI listening comprehension evaluator. Assess this user's performance on a ${difficulty} level listening exercise.

Audio Script: "${listeningContent.audio_script}"
Scenario: "${listeningContent.scenario_description}"

User's Answers:
${userAnswers.map((ans, idx) => `Question ${idx + 1}: "${ans.question}"
User Answer: "${ans.user_answer}"
Correct Answer: "${ans.correct_answer}"
Was Correct: ${ans.is_correct}`).join('\n\n')}

Total Correct: ${userAnswers.filter(a => a.is_correct).length}/${userAnswers.length}

Evaluate the user's listening comprehension level:

{
  "comprehension_score": <0-100>,
  "correct_answers": ${userAnswers.filter(a => a.is_correct).length},
  "total_questions": ${userAnswers.length},
  "cefr_level": "<Estimated CEFR level: A2, B1.1, B1.2, or B2>",
  "feedback": {
    "strengths": "What the user demonstrated well in listening comprehension",
    "weaknesses": "Areas needing improvement in listening skills"
  }
}`;

    return await callOpenAI(prompt, true);
};

// Simulate realistic answer sets for different listening performance levels
const simulateListeningAnswers = (questions, difficulty) => {
    const createAnswers = (correctCount, description) => {
        return questions.map((q, idx) => ({
            question: q.question,
            user_answer: idx < correctCount ? q.correct_answer : (q.options && q.options.length > 0 ? q.options[0] : "Wrong answer"),
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
        below_level: createAnswers(levels.below, `Below ${difficulty} level listening performance`),
        at_level: createAnswers(levels.at, `At ${difficulty} level listening performance`), 
        above_level: createAnswers(levels.above, `Above ${difficulty} level listening performance`)
    };
};

const generateListeningContent = async (language, difficulty) => {
    const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';
    
    // OPTIMIZED PROMPT - shorter and more focused
    const prompt = `You are a YKI Listening Practice Generator for ${difficulty} level users in ${languageName}.

Generate a realistic single-voice listening scenario (MAX 1 MINUTE content, ~150-200 words):

Choose ONE scenario type:
• NEWS REPORT: Short radio news about local events
• PERSONAL STORY: Someone telling about their holiday/daily life
• NARRATIVE: Someone describing an event or process
• ANNOUNCEMENT: Public service or store announcement

Format as JSON:
{
  "audio_script": "Complete single-person narrative ENTIRELY IN ${languageName} (150-200 words MAX)",
  "scenario_description": "Brief context description in ${languageName}",
  "questions": [
    {
      "question_type": "multiple_choice",
      "question": "Question text ENTIRELY IN ${languageName}",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Correct option in ${languageName}",
      "explanation": "Explanation ENTIRELY IN ${languageName}"
    }
  ]
}

Create 4-6 comprehension questions. EVERYTHING must be in ${languageName}.`;

    const responseSchema = {
        type: "object",
        properties: {
            audio_script: { type: "string" },
            scenario_description: { type: "string" },
            questions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        question_type: { type: "string" },
                        question: { type: "string" },
                        options: { type: "array", items: { type: "string" } },
                        correct_answer: { type: "string" },
                        explanation: { type: "string" }
                    },
                    required: ["question", "correct_answer"]
                }
            }
        },
        required: ["audio_script", "questions"]
    };

    return await callOpenAI(prompt, responseSchema);
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
        if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') return new Response('Access denied', { status: 403, headers: corsHeaders });

        const { language, difficulty } = await req.json();

        // Step 1: Generate listening content using the real user-facing function
        const generatedContent = await generateListeningContent(language, difficulty);

        // Step 2: Simulate realistic user answer sets
        const simulatedAnswers = simulateListeningAnswers(generatedContent.questions || [], difficulty);

        // Step 3: PARALLELIZE AI assessment calls for better performance
        const entries = Object.entries(simulatedAnswers);
        
        const assessments = await Promise.all(entries.map(([levelName, answers]) =>
            assessListeningAnswers(generatedContent, answers, difficulty)
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

        // Step 4: Define expected CEFR levels for validation
        const expectedLevels = {
            below_level: ["A2", "B1.1"],
            at_level: ["B1.1", "B1.2", difficulty],
            above_level: ["B1.2", "B2"]
        };

        // Step 5: Validate assessment accuracy
        const evalAccuracy = (result, expected) => {
            return expected.includes(String(result.cefr_level));
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

        // Step 6: Evaluate the generated content using the enhanced detailed prompt
        const evaluationPrompt = `You are a certified YKI listening comprehension evaluator and CEFR language expert. Your task is to evaluate an AI-generated listening comprehension exercise for the Finnish or Swedish YKI exam at the ${difficulty} level.

Generated Content:
- Audio script: "${generatedContent.audio_script}"
- Scenario: "${generatedContent.scenario_description}"
- Number of questions: ${generatedContent.questions?.length || 0}

Assessment Agent Results:
- Below Level Test: Expected ${agentAccuracyEval.below_level.expected}, Got ${agentAccuracyEval.below_level.actual} (${agentAccuracyEval.below_level.match ? 'PASS' : 'FAIL'})
- At Level Test: Expected ${agentAccuracyEval.at_level.expected}, Got ${agentAccuracyEval.at_level.actual} (${agentAccuracyEval.at_level.match ? 'PASS' : 'FAIL'})
- Above Level Test: Expected ${agentAccuracyEval.above_level.expected}, Got ${agentAccuracyEval.above_level.actual} (${agentAccuracyEval.above_level.match ? 'PASS' : 'FAIL'})

Evaluate the exercise using these official criteria:

1. **CEFR Level Alignment (25%)**: Does the listening transcript match the expected linguistic features of level ${difficulty}?
2. **Question Quality & Depth (25%)**: Do the questions truly test comprehension? Is there a mix of factual and inferential questions?
3. **Naturalness & Realism of Script (25%)**: Does the audio script resemble real-life spoken language?
4. **Assessment Agent Accuracy (25%)**: How well did the AI assess different performance levels?

Respond in the following JSON format:

{
  "overall_score": <0-100>,
  "level_alignment": { "score": <0-100>, "assessment": "Assessment of CEFR level appropriateness" },
  "question_quality": { "score": <0-100>, "assessment": "Assessment of question depth and variety" },
  "naturalness": { "score": <0-100>, "assessment": "Assessment of script realism and naturalness" },
  "assessment_accuracy": { "score": <0-100>, "assessment": "Assessment of AI grading accuracy across performance levels" },
  "summary": {
    "strengths": "What the AI system did well (both generation and assessment)",
    "weaknesses": "Areas needing improvement in both content and assessment)",
    "final_verdict": "Overall assessment of the complete listening evaluation system"
  },
  "recommendations": "Concrete suggestions for improving both content generation and assessment accuracy"
}`;

        const evaluation = await callOpenAI(evaluationPrompt, true);
        
        const ensureString = (value) => value ? String(value) : '';

        // Step 7: Save the evaluation report
        const reportPayload = {
            model_type: "listening",
            difficulty_level: difficulty,
            language: language,
            score: evaluation.overall_score || 0,
            report_summary: {
                strengths: ensureString(evaluation.summary?.strengths),
                weaknesses: ensureString(evaluation.summary?.weaknesses),
                final_verdict: ensureString(evaluation.summary?.final_verdict)
            },
            detailed_breakdown: {
                level_alignment: evaluation.level_alignment,
                question_quality: evaluation.question_quality,
                naturalness: evaluation.naturalness,
                assessment_accuracy: evaluation.assessment_accuracy
            },
            recommendations: ensureString(evaluation.recommendations),
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
        console.error("Listening evaluation error:", error);
        return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});
