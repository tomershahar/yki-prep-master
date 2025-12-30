
import { createClient } from 'npm:@base44/sdk@0.1.0';

// Global base44 client - will be used for knowledge base access that is assumed to be
// general or public, not tied to a specific user's authentication for listing files.
// If base44.entities.KnowledgeBaseContent.list() requires the specific user's token,
// this global caching approach would be incorrect due to potential race conditions
// or incorrect authorization for cached data.
const base44Client = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

const callOpenAI = async (prompt, responseSchema = null) => {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
        throw new Error("OpenAI API key not found");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
            throw new Error(`OpenAI API error: ${response.status}`);
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

async function getKnowledgeBaseFiles() {
  if (cachedFileUrls) return cachedFileUrls;
  const knowledgeFiles = await base44Client.entities.KnowledgeBaseContent.list();
  cachedFileUrls = knowledgeFiles.map(file => file.file_url);
  return cachedFileUrls;
}

// This is the EXACT same function that users experience during practice
const gradeWritingWithAI = async (task, answer, difficulty, chosenPrompt, fileUrls) => {
    const prompt = `You are an expert certified YKI writing examiner. Your task is to grade a user's writing task using the official YKI writing criteria for level ${difficulty}.

Refer explicitly to the following core criteria, derived from the official YKI framework:
1. Communicative ability (e.g., describing, narrating, reporting, expressing opinion)
2. Coherence and cohesion (how logically structured and connected the text is)
3. Vocabulary precision, range, and idiomaticity
4. Grammar accuracy and sentence structure

You will receive:
- The writing prompt
- The user's written answer
- Reference knowledge base documents (YKI official PDF)

Writing Prompt: "${chosenPrompt || task.prompt}"
User's Written Answer: "${answer}"

IMPORTANT: Evaluate response length rigorously. A too-short answer (less than expected sentence or word count) must be penalized, even if the grammar or vocabulary is good. Use the following guidelines:

- A1/A2: At least 4–6 clear, full sentences
- B1: At least 80–100 words, showing idea development and transitions
- B2: At least 120–150 words, with detailed arguments or reasoning

Responses that are significantly underdeveloped or clearly too short (e.g., fewer than half the expected words for the level) must be scored as 0 in at least two categories: communicative ability and coherence. Do not compensate with higher scores in vocabulary or grammar unless there's clear evidence of advanced usage.

Ensure your judgment reflects the holistic demands of the YKI level — not only grammatical accuracy, but also content richness, fluency, and development of ideas.

Evaluate each dimension below using a 0–2 point scale:
- 0 = below expectations for this level
- 1 = partially meets expectations
- 2 = fully meets expectations

Output must be in the following JSON format:

{
  "scores": {
    "communicative_ability": <0-2>,
    "coherence": <0-2>,
    "vocabulary": <0-2>,
    "grammar": <0-2>
  },
  "total_score": <sum from 0–8>,
  "feedback": {
    "strengths": "<Describe what was done well using clear references to the YKI criteria.>",
    "weaknesses": "<Describe what needs improvement, aligned to YKI expectations.>"
  },
  "cefr_level": "<Estimate the CEFR level based on total score and criteria. Use this logic: 0–3 = A2, 4–5 = B1.1, 6–7 = B1.2, 8 = B2>"
}`;

    try {
        const response = await callOpenAI(prompt, true);
        return response;
    } catch (error) {
        console.error("Grading error:", error);
        // Return a fallback response if grading fails
        return {
            scores: {
                communicative_ability: 0,
                coherence: 0,
                vocabulary: 0,
                grammar: 0
            },
            total_score: 0,
            feedback: {
                strengths: "Unable to evaluate due to technical error",
                weaknesses: "Grading system temporarily unavailable"
            },
            cefr_level: "N/A"
        };
    }
};

// Simulate realistic writing responses for different performance levels
const simulateWritingResponses = (language, difficulty) => {
    const isFinnish = language === 'finnish';

    // Define responses with text and expected score ranges (0-8 scale)
    const finnishResponses = {
        'A1': {
            below_level: { text: `Minä tykkään. Hyvä. Kiitos.`, expected_score_range: "0-2" },
            at_level: { text: `Minä asun Helsingissä. Se on kaunis kaupunki. Minulla on koira. Sen nimi on Max. Minä tykkään kävelystä Max kanssa puistossa. Helsinki on iso kaupunki ja siellä on paljon kiviä rakennuksia.`, expected_score_range: "3-5" },
            above_level: { text: `Asun Helsingissä, joka on Suomen pääkaupunki. Kaupunki on erittäin kaunis ja siellä on paljon historiallisia rakennuksia. Minulla on pieni koira nimeltä Max, ja me kävelemme usein lähipuistossa. Helsinki tarjoaa paljon kulttuurisia tapahtumia ja museoita. Rakastan tätä kaupunkia, koska se yhdistää modernin elämän ja luonnon kauniisti.`, expected_score_range: "6-7" }
        },
        'A2': {
            below_level: { text: `Minä asun kaupungissa. Se on hyvä paikka.`, expected_score_range: "0-3" },
            at_level: { text: `Asun pienessä kaupungissa Etelä-Suomessa. Täällä on noin 50,000 asukasta. Kaupungissamme on useita kouluja, sairaala ja iso kauppakeskus. Minulla on mukava koti ja ystävällisiä naapureita. Kesällä käyn usein uimassa järvessä. Talvella hiihdan metsässä. Pidän kaupungistani, koska se on rauhallinen ja turvallinen paikka asua.`, expected_score_range: "4-6" },
            above_level: { text: `Asun keskikokoisessa kaupungissa, jossa elämä on monipuolista ja kiinnostavaa. Kaupunkimme sijaitsee kauniin järven rannalla, mikä tekee siitä erityisen viehättävän. Täällä on erinomaisia ravintoloita, kulttuuria tarjoavia teattereita ja moderneja liikuntamahdollisuuksia. Erityisesti pidän siitä, että voin nauttia sekä kaupungin palveluista että luonnon läheisyydestä. Viikonloppuisin osallistun usein paikallisiin tapahtumiin ja tapaan ystäviäni torilla.`, expected_score_range: "7-8" }
        },
        'B1': {
            below_level: { text: `Minä asun Turussa. Se on vanha kaupunki. Siellä on linna ja joki. Minä pidän siitä.`, expected_score_range: "0-4" },
            at_level: { text: `Asun Turussa, joka on Suomen entinen pääkaupunki. Kaupunki on täynnä historiaa - täällä on kuuluisa Turun linna ja kaunis tuomiokirkko. Aurajoki virtaa kaupungin halki ja sen varrella on mukavia ravintoloita ja kahviloita. Vaikka Turku ei ole yhtä suuri kuin Helsinki, se tarjoaa paljon kulttuurielämyksiä. Kesäisin kaupungissa järjestetään monia festivaaleja. Pidän Turusta, koska se yhdistää historian ja modernin elämän harmonisesti.`, expected_score_range: "5-7" },
            above_level: { text: `Turku on kaupunki, johon olen syvästi kiintynyt sen monien kerroksellisuuksien vuoksi. Historiallisena keskuksena se tarjoaa ainutlaatuisen näkökulman Suomen menneisyyteen, mutta samalla se on dynaaminen yliopistokaupunki, joka tuo nuorekasta energiaa katukuvaan. Aurajoen rantabulevardi on erityisen viehättävä kesäiltaisin, kun ihmiset kokoontuvat nauttimaan kulttuuritarjonnasta ja ravintola-elämästä. Arvostan myös sitä, että merellinen sijainti tuo kaupunkiin erityistä tunnelmaa ja lukuisia saaristokohteita on helppo saavuttaa.`, expected_score_range: "7-8" }
        },
        'B2': {
            below_level: { text: `Tampere on teollisuuskaupunki Suomessa. Siellä asuu paljon ihmisiä. On tehtaita ja yliopisto. Kaupunki on kasvanut viime vuosina.`, expected_score_range: "0-5" },
            at_level: { text: `Tampere edustaa minulle Suomen teollisuushistoriaa ja modernia kehitystä yhtäaikaisesti. Kaupungin punatiiliarkkitehtuuri kertoo menneisyydestä, kun taas Tampere-talot ja modernit asuinalueet heijastavat tulevaisuuteen suuntautuvaa ajatusta. Erityisesti arvostan kaupungin kulttuuri-ilmapiiriä - täällä toimii useita teattereita, Tampere-talo tarjoaa korkealaatuisia konsertteja, ja kesäiset festivaalit tuovat kansainvälistä tunnelmaa. Lisäksi kaupungin sijainti kahden järven välissä tekee siitä luonnonläheisen, vaikka kyseessä onkin merkittävä teollisuuskeskus.`, expected_score_range: "6-8" },
            above_level: { text: `Tampere ilmentää mielestäni Suomen kaupunkikehityksen parhaita puolia: se on onnistunut säilyttämään teollisuushistoriansa autenttisuuden samalla kun se on kehittynyt moderniksi, dynaamiseksi keskukseksi. Näsijärven ja Pyhäjärven välistä sijaintia ei voi olla ihailemata, ja erityisesti Pyynikinharju tarjoaa upeat mahdollisuudet retkeilyyn ja ulkoiluun keskellä kaupunkiympäristöä. Kulttuurisesti Tampere on rikastuttanut elämääni merkittävästi - kaupungin teatteri-ilmapiiri on ainutlaatuinen Suomessa, ja monipuolinen ravintolatarjonta heijastaa sekä perinteitä että kansainvälisiä vaikutteita. Samalla teknologiakeskittymät ja yliopisto luovat innovatiivista ilmapiiriä, joka houkuttelee nuoria ammattilaisia.`, expected_score_range: "8" }
        }
    };

    const swedishResponsesGeneric = { // Swedish responses are generic and not tied to difficulty per outline's suggestion
        below_level: { text: `Jag bor i Stockholm. Det är bra.`, expected_score_range: "0-3" },
        at_level: { text: `Jag bor i Stockholm som är Sveriges huvudstad. Det är en vacker stad med många museer och parker. Jag gillar att promenera i Gamla stan och titta på de gamla byggnaderna. På sommaren åker jag ofta till skärgården.`, expected_score_range: "4-6" },
        above_level: { text: `Stockholm är en stad som har fångat mitt hjärta genom sin unika kombination av historisk charm och modern dynamik. Gamla stans kullerstensgator berättar om århundraden av historia, medan Södermalm erbjuder en mer bohemisk atmosfär med kreativa butiker och mysiga kaféer. Särskilt uppskattar jag stadens närhet till naturen - skärgården ligger bara en kort båtresa bort, och Djurgården erbjuder grönska mitt i stadskärnan.`, expected_score_range: "7-8" }
    };

    if (!isFinnish) {
        return swedishResponsesGeneric;
    }

    // Return difficulty-specific Finnish responses, default to B1 if not found
    return finnishResponses[difficulty] || finnishResponses['B1'];
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
        // This base44 client is for user-specific actions like auth.me() and creating EvaluationReport,
        // and will have the user's authentication token set per request.
        const userSpecificBase44Client = createClient({ appId: Deno.env.get('BASE44_APP_ID') });
        
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401, headers: corsHeaders });
        }
        
        const token = authHeader.split(' ')[1];
        userSpecificBase44Client.auth.setToken(token);
        
        const user = await userSpecificBase44Client.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response('Access denied', { status: 403, headers: corsHeaders });
        }

        const { language, difficulty } = await req.json();
        const languageName = language === 'finnish' ? 'Finnish' : 'Swedish';

        // Step 1: Generate a writing task with OPTIMIZED PROMPT
        const taskGenerationPrompt = `Generate a realistic YKI writing task for ${difficulty} level in ${languageName}.

Create a JSON response:
{
  "writing_task": {
    "prompt": "A realistic writing task in ${languageName} (e.g., write about your hometown, describe your opinion on a topic, etc.)",
    "expected_length": "appropriate word count for ${difficulty} level"
  }
}`;

        const taskData = await callOpenAI(taskGenerationPrompt, true);
        
        // Step 2: Get knowledge base files using cache
        const fileUrls = await getKnowledgeBaseFiles();

        // Step 3: Generate realistic test responses for different performance levels
        const simulatedResponses = simulateWritingResponses(language, difficulty);

        // Step 4: PARALLELIZE grading for better performance
        const entries = Object.entries(simulatedResponses);
        
        const assessments = await Promise.all(entries.map(([levelName, response]) =>
            gradeWritingWithAI(
                taskData.writing_task,
                response.text,
                difficulty,
                taskData.writing_task.prompt,
                fileUrls
            )
            .then(result => ({ levelName, result, response }))
            .catch(error => ({ levelName, error, response }))
        ));

        const gradingResults = [];
        assessments.forEach(({ levelName, result, error, response }) => {
            if (error) {
                console.error(`Failed to grade ${levelName}:`, error);
                gradingResults.push({
                    label: levelName,
                    expected_range: response.expected_score_range,
                    ai_score: 0,
                    ai_cefr_level: "N/A",
                    ai_feedback: { strengths: "Error", weaknesses: "Grading failed" },
                    sample_text: response.text,
                    error: error.message
                });
            } else {
                gradingResults.push({
                    label: levelName,
                    expected_range: response.expected_score_range,
                    ai_score: result.total_score,
                    ai_cefr_level: result.cefr_level,
                    ai_feedback: result.feedback,
                    sample_text: response.text
                });
            }
        });

        // Step 5: Define expected CEFR levels for validation based on gradeWritingWithAI's output
        const expectedLevels = {
            below_level: ["A2"], // Any score 0-3 maps to A2
            at_level: [], // Dynamically set
            above_level: [] // Dynamically set
        };

        if (['A1', 'A2'].includes(difficulty)) {
            expectedLevels.at_level.push("A2");
            expectedLevels.above_level.push("B1.1", "B1.2", "B2");
        } else if (difficulty === 'B1') {
            expectedLevels.at_level.push("B1.1", "B1.2");
            expectedLevels.above_level.push("B1.2", "B2");
        } else if (difficulty === 'B2') {
            expectedLevels.at_level.push("B2");
            expectedLevels.above_level.push("B2"); // Cannot go higher than B2
        }

        // Step 6: Validate assessment accuracy
        const evalAccuracy = (result, expectedCEFRs) => {
            return expectedCEFRs.includes(result.ai_cefr_level);
        };

        const agentAccuracyEval = {};
        const belowLevelResult = gradingResults.find(r => r.label === 'below_level');
        const atLevelResult = gradingResults.find(r => r.label === 'at_level');
        const aboveLevelResult = gradingResults.find(r => r.label === 'above_level');

        if (belowLevelResult) {
            agentAccuracyEval.below_level = {
                expected: expectedLevels.below_level.join(' or '),
                actual: belowLevelResult.ai_cefr_level,
                match: evalAccuracy(belowLevelResult, expectedLevels.below_level),
                score: belowLevelResult.ai_score,
                full_result: belowLevelResult
            };
        }
        if (atLevelResult) {
            agentAccuracyEval.at_level = {
                expected: expectedLevels.at_level.join(' or '),
                actual: atLevelResult.ai_cefr_level,
                match: evalAccuracy(atLevelResult, expectedLevels.at_level),
                score: atLevelResult.ai_score,
                full_result: atLevelResult
            };
        }
        if (aboveLevelResult) {
            agentAccuracyEval.above_level = {
                expected: expectedLevels.above_level.join(' or '),
                actual: aboveLevelResult.ai_cefr_level,
                match: evalAccuracy(aboveLevelResult, expectedLevels.above_level),
                score: aboveLevelResult.ai_score,
                full_result: aboveLevelResult
            };
        }

        // Step 7: Enhanced evaluation with comprehensive validation
        const evaluationPrompt = `You are a certified YKI writing examiner and evaluator. Your task is to validate how well the AI scoring system evaluates three types of user responses to a ${languageName} ${difficulty} writing prompt.

Writing Task: "${taskData.writing_task.prompt}"

Assessment Agent Results:
- Below Level Test: Expected ${agentAccuracyEval.below_level?.expected || 'N/A'}, Got ${agentAccuracyEval.below_level?.actual || 'N/A'} (${agentAccuracyEval.below_level?.match ? 'PASS' : 'FAIL'})
- At Level Test: Expected ${agentAccuracyEval.at_level?.expected || 'N/A'}, Got ${agentAccuracyEval.at_level?.actual || 'N/A'} (${agentAccuracyEval.at_level?.match ? 'PASS' : 'FAIL'})  
- Above Level Test: Expected ${agentAccuracyEval.above_level?.expected || 'N/A'}, Got ${agentAccuracyEval.above_level?.actual || 'N/A'} (${agentAccuracyEval.above_level?.match ? 'PASS' : 'FAIL'})

Test Responses:
**Below Level Response:** "${belowLevelResult?.sample_text}" (AI Score: ${belowLevelResult?.ai_score}/8)
**At Level Response:** "${atLevelResult?.sample_text}" (AI Score: ${atLevelResult?.ai_score}/8)
**Above Level Response:** "${aboveLevelResult?.sample_text}" (AI Score: ${aboveLevelResult?.ai_score}/8)

Evaluate both the writing task generation quality AND the AI assessment accuracy:

{
  "overall_score": <0-100 integer based on both task quality and AI grading accuracy>,
  "task_generation": { "score": <0-100>, "assessment": "Quality of the generated writing task" },
  "assessment_accuracy": { "score": <0-100>, "assessment": "How accurately the AI graded different performance levels" },
  "level_discrimination": { "score": <0-100>, "assessment": "How well the AI distinguished between below, at, and above level responses" },
  "summary": {
    "strengths": "What the AI system did well (both generation and assessment)",
    "weaknesses": "Where the AI system failed or was inconsistent",
    "final_verdict": "Overall assessment of the complete writing evaluation system"
  },
  "recommendations": "Specific suggestions to improve both task generation and assessment accuracy",
  "improved_prompt": "Complete improved version of the grading prompt that addresses identified issues"
}`;

        const evaluation = await callOpenAI(evaluationPrompt, true);

        // Helper function to ensure value is a string, preventing database errors
        const ensureString = (value) => {
            if (typeof value === 'string') return value;
            if (Array.isArray(value)) return value.join('\n');
            if (value === null || value === undefined) return '';
            return String(value);
        };
        
        // Step 8: Save the comprehensive evaluation report
        const reportPayload = {
            model_type: "writing",
            difficulty_level: difficulty,
            language: language,
            score: evaluation.overall_score || 0,
            report_summary: {
                strengths: ensureString(evaluation.summary?.strengths),
                weaknesses: ensureString(evaluation.summary?.weaknesses),
                final_verdict: ensureString(evaluation.summary?.final_verdict)
            },
            detailed_breakdown: {
                task_generation: { 
                    score: evaluation.task_generation?.score || 0,
                    assessment: ensureString(evaluation.task_generation?.assessment)
                },
                assessment_accuracy: { 
                    score: evaluation.assessment_accuracy?.score || 0,
                    assessment: ensureString(evaluation.assessment_accuracy?.assessment)
                },
                level_discrimination: { 
                    score: evaluation.level_discrimination?.score || 0,
                    assessment: ensureString(evaluation.level_discrimination?.assessment)
                }
            },
            recommendations: ensureString(evaluation.recommendations),
            improved_prompt: ensureString(evaluation.improved_prompt),
            agent_accuracy_eval: agentAccuracyEval,
            generated_content: {
                task: taskData,
                simulated_responses: simulatedResponses,
                grading_results: gradingResults,
                evaluation: evaluation
            }
        };

        const report = await userSpecificBase44Client.entities.EvaluationReport.create(reportPayload);

        return new Response(JSON.stringify(report), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });

    } catch (error) {
        console.error("Writing evaluation error:", error);
        return new Response(JSON.stringify({ 
            error: error.message,
            stack: error.stack 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});
