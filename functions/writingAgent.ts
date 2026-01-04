import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getUserContext } from './getUserContext.js';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Writing Agent - Specialized AI agent for end-to-end writing module experience
 * Handles: practice generation, grading, tips, and progressive exercises
 */

async function callOpenAI(messages, responseFormat = null, timeout = 90000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const body = {
            model: 'gpt-4o',
            messages: messages,
            temperature: 0.7,
        };

        if (responseFormat) {
            body.response_format = {
                type: 'json_schema',
                json_schema: {
                    name: 'writing_response',
                    strict: true,
                    schema: responseFormat
                }
            };
        }

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        return responseFormat ? JSON.parse(content) : content;
    } finally {
        clearTimeout(timeoutId);
    }
}

function buildSystemPrompt(userContext, action) {
    const language = userContext.target_language === 'finnish' ? 'Finnish' : 'Swedish';
    const level = userContext.writing_level;
    const avgScore = userContext.section_performance.writing.average_score;
    
    const baseContext = `You are an expert YKI Writing Coach for ${language} language learners at CEFR level ${level}.

USER CONTEXT:
- Current Level: ${level}
- Recent Average Score: ${avgScore}%
- Total Writing Hours: ${userContext.section_performance.writing.total_hours.toFixed(1)}h
- Recent Sessions: ${userContext.section_performance.writing.sessions_count}
- Target Language: ${language}
- Daily Goal: ${userContext.daily_goal_minutes} minutes

Your mission is to provide personalized, actionable, and encouraging guidance that helps the learner improve their ${language} writing skills systematically.`;

    switch (action) {
        case 'generate_practice':
            return `${baseContext}

TASK: Generate two personalized writing tasks tailored to this user's level and recent performance.

REQUIREMENTS:
1. Task 1: Informal message (email to friend, text message, note)
2. Task 2: Formal message or opinion piece (official email, essay, article)
3. Both tasks must be ENTIRELY in ${language}
4. Match CEFR ${level} expectations exactly:
   - A1: 30-50 words, simple vocabulary, basic structures
   - A2: 40-60 words, everyday topics, compound sentences
   - B1: 60-100 words, reasoning, detailed descriptions
   - B2: 80-120 words, complex structures, abstract topics
5. Choose topics that are culturally relevant and engaging
6. Provide clear prompts, sample answers, and assessment criteria

Focus on areas where the user can improve based on their ${avgScore}% average score.`;

        case 'grade_submission':
            return `${baseContext}

TASK: Grade the user's writing submission with detailed, constructive feedback.

EVALUATION CRITERIA:
1. Task Fulfillment (0-100): Did they address all parts of the prompt?
2. Language Sophistication (0-100): Appropriate vocabulary, structures, and expressions for ${level}
3. Grammatical Accuracy (0-100): Correct grammar, spelling, and punctuation
4. Coherence & Cohesion (0-100): Logical flow, appropriate connectors, clear organization
5. Style & Register (0-100): Appropriate tone for the task type (formal/informal)

FEEDBACK REQUIREMENTS:
- Provide specific examples from their text
- Highlight both strengths and areas for improvement
- Give concrete suggestions with corrected alternatives
- Recommend 2-3 grammar topics or vocabulary areas to study
- Include study resources or practice recommendations
- Be encouraging and constructive

Calculate overall score as weighted average: 25% each criterion.`;

        case 'get_tips':
            return `${baseContext}

TASK: Provide 3-5 personalized writing tips for this user based on their level and performance.

TIPS SHOULD:
1. Be specific to ${language} and CEFR ${level}
2. Address common challenges at this level
3. Include practical examples in ${language}
4. Reference grammar rules, vocabulary, or structures to focus on
5. Be immediately actionable

Consider their recent performance (${avgScore}% average) and suggest areas for growth.`;

        case 'suggest_exercises':
            return `${baseContext}

TASK: Suggest 3-5 progressive writing exercises to help this user improve.

EXERCISES SHOULD:
1. Build upon their current level (${level})
2. Target specific skill gaps based on their ${avgScore}% performance
3. Progress in difficulty
4. Include clear instructions in ${language}
5. Provide expected outcomes and self-assessment criteria

Focus on practical, engaging exercises that the user can complete in 10-30 minutes.`;

        default:
            return baseContext;
    }
}

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    try {
        // Get standardized user context
        const userContext = await getUserContext(req);
        
        // Parse request body
        const body = await req.json();
        const { action, data } = body;

        if (!action) {
            throw new Error('Missing required parameter: action');
        }

        let result;

        switch (action) {
            case 'generate_practice': {
                const difficulty = data?.difficulty || userContext.writing_level;
                const language = userContext.target_language === 'finnish' ? 'Finnish' : 'Swedish';
                
                const systemPrompt = buildSystemPrompt(userContext, 'generate_practice');
                const userPrompt = `Generate two writing tasks for ${language} at level ${difficulty}. Make them engaging and personalized based on the user's context.`;

                const responseSchema = {
                    type: "object",
                    properties: {
                        tasks: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    task_type: { type: "string" },
                                    prompt: { type: "string" },
                                    word_count: { type: "string" },
                                    sample_answer: { type: "string" },
                                    assessment_criteria: {
                                        type: "object",
                                        properties: {
                                            task_fulfillment: { type: "string" },
                                            language_sophistication: { type: "string" },
                                            grammatical_accuracy: { type: "string" }
                                        },
                                        required: ["task_fulfillment", "language_sophistication", "grammatical_accuracy"],
                                        additionalProperties: false
                                    }
                                },
                                required: ["task_type", "prompt", "word_count", "sample_answer", "assessment_criteria"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["tasks"],
                    additionalProperties: false
                };

                result = await callOpenAI([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ], responseSchema, 120000);
                break;
            }

            case 'grade_submission': {
                const { task, userResponse, difficulty } = data;
                
                if (!task || !userResponse) {
                    throw new Error('Missing required parameters: task, userResponse');
                }

                const systemPrompt = buildSystemPrompt(userContext, 'grade_submission');
                const userPrompt = `TASK PROMPT:\n${task}\n\nUSER RESPONSE:\n${userResponse}\n\nDIFFICULTY: ${difficulty || userContext.writing_level}\n\nProvide detailed grading and feedback.`;

                const responseSchema = {
                    type: "object",
                    properties: {
                        overall_score: { type: "number" },
                        scores: {
                            type: "object",
                            properties: {
                                task_fulfillment: { type: "number" },
                                language_sophistication: { type: "number" },
                                grammatical_accuracy: { type: "number" },
                                coherence_cohesion: { type: "number" },
                                style_register: { type: "number" }
                            },
                            required: ["task_fulfillment", "language_sophistication", "grammatical_accuracy", "coherence_cohesion", "style_register"],
                            additionalProperties: false
                        },
                        strengths: {
                            type: "array",
                            items: { type: "string" }
                        },
                        areas_for_improvement: {
                            type: "array",
                            items: { type: "string" }
                        },
                        specific_corrections: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    original: { type: "string" },
                                    corrected: { type: "string" },
                                    explanation: { type: "string" }
                                },
                                required: ["original", "corrected", "explanation"],
                                additionalProperties: false
                            }
                        },
                        study_recommendations: {
                            type: "array",
                            items: { type: "string" }
                        },
                        encouraging_message: { type: "string" }
                    },
                    required: ["overall_score", "scores", "strengths", "areas_for_improvement", "specific_corrections", "study_recommendations", "encouraging_message"],
                    additionalProperties: false
                };

                result = await callOpenAI([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ], responseSchema, 120000);
                break;
            }

            case 'get_tips': {
                const systemPrompt = buildSystemPrompt(userContext, 'get_tips');
                const userPrompt = `Provide personalized writing tips for this user.`;

                const responseSchema = {
                    type: "object",
                    properties: {
                        tips: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    explanation: { type: "string" },
                                    example: { type: "string" }
                                },
                                required: ["title", "explanation", "example"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["tips"],
                    additionalProperties: false
                };

                result = await callOpenAI([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ], responseSchema, 90000);
                break;
            }

            case 'suggest_exercises': {
                const systemPrompt = buildSystemPrompt(userContext, 'suggest_exercises');
                const userPrompt = `Suggest progressive writing exercises for this user.`;

                const responseSchema = {
                    type: "object",
                    properties: {
                        exercises: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    instructions: { type: "string" },
                                    time_estimate: { type: "string" },
                                    learning_outcome: { type: "string" }
                                },
                                required: ["title", "description", "instructions", "time_estimate", "learning_outcome"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["exercises"],
                    additionalProperties: false
                };

                result = await callOpenAI([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ], responseSchema, 90000);
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return Response.json({
            status: 'success',
            action: action,
            result: result,
            user_context: userContext // Include for debugging/transparency
        }, {
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });

    } catch (error) {
        console.error('Writing Agent Error:', error);
        return Response.json({
            status: 'error',
            message: error.message
        }, {
            status: error.message.includes('authenticated') ? 401 : 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
            }
        });
    }
});