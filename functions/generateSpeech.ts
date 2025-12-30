import { createClient } from 'npm:@base44/sdk@0.1.0';
import { createHash } from 'node:crypto';

const base64encode = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
};

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { text_to_speak, language = "finnish", gender = "female" } = await req.json();

        if (!text_to_speak) {
            return new Response(JSON.stringify({ 
                status: "error", 
                message: "Text to speak is required" 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }
        
        // FIX: Add character limit check to prevent crashes on long inputs
        const MAX_CHAR_LIMIT = 4096;
        if (text_to_speak.length > MAX_CHAR_LIMIT) {
            console.error(`Text length (${text_to_speak.length}) exceeds the limit of ${MAX_CHAR_LIMIT}.`);
            return new Response(JSON.stringify({
                status: "error",
                message: `The provided text is too long (${text_to_speak.length} characters). The maximum allowed length is ${MAX_CHAR_LIMIT}.`
            }), {
                status: 413, // Payload Too Large
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create hash for caching
        const textHash = createHash('md5').update(`${text_to_speak}_${language}_${gender}`).digest('hex');

        // Check if we already have this audio cached
        try {
            const cachedAudio = await base44.entities.GeneratedAudio.filter({ text_hash: textHash }, '-created_date', 1);
            if (cachedAudio.length > 0) {
                return new Response(JSON.stringify({ 
                    status: "success",
                    audio_base64: cachedAudio[0].audio_base64,
                    message: "Speech retrieved from cache (cost-saving!)" 
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                });
            }
        } catch (cacheError) {
            console.log("Cache lookup failed, proceeding with API call:", cacheError.message);
        }

        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            return new Response(JSON.stringify({ 
                status: "error", 
                message: "Server configuration error: The OPENAI_API_KEY secret is not set." 
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        // OpenAI Voice mapping per your instructions
        const voiceMap = {
            finnish: {
                female: "nova",
                male: "onyx"
            },
            swedish: {
                female: "shimmer",
                male: "onyx"
            }
        };

        const voice = voiceMap[language]?.[gender] || "nova";

        // Call OpenAI Text-to-Speech API
        const openAIUrl = 'https://api.openai.com/v1/audio/speech';
        
        const openAIResponse = await fetch(openAIUrl, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "tts-1",
                input: text_to_speak,
                voice: voice
            })
        });

        if (!openAIResponse.ok) {
            const errorBodyText = await openAIResponse.text();
            let errorDetail = "Failed to parse error from OpenAI.";
            try {
                const errorJson = JSON.parse(errorBodyText);
                errorDetail = errorJson.error?.message || JSON.stringify(errorJson.error);
            } catch(e) {
                errorDetail = errorBodyText.substring(0, 300);
            }

            return new Response(JSON.stringify({ 
                status: "error", 
                message: `OpenAI API error: ${openAIResponse.status}. Details: ${errorDetail}` 
            }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        const audioData = await openAIResponse.arrayBuffer();
        const base64Audio = base64encode(audioData);

        // Cache the generated audio for future use
        try {
            await base44.entities.GeneratedAudio.create({
                text_hash: textHash,
                text_content: text_to_speak,
                language: language,
                gender: gender,
                audio_base64: base64Audio,
                openai_voice: voice
            });
        } catch (cacheError) {
            console.log("Failed to cache audio, but continuing:", cacheError.message);
        }

        return new Response(JSON.stringify({ 
            status: "success",
            audio_base64: base64Audio,
            message: "Speech generated and cached successfully using OpenAI" 
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            status: "error", 
            message: `Internal function error: ${error.message}` 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});