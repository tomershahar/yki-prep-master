import { createClient } from 'npm:@base44/sdk@0.1.0';
import { createHash } from 'node:crypto';

const base64encode = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
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

        const { dialogue_text, language = "finnish" } = await req.json();

        if (!dialogue_text) {
            return new Response(JSON.stringify({ 
                status: "error", 
                message: "Dialogue text is required" 
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
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

        // Use fixed, distinct voices
        const voiceMap = {
            female: "nova",
            male: "onyx"
        };

        const dialogueLines = [];
        const quotedParts = [...dialogue_text.matchAll(/"([^"]+)"|'([^']+)'/g)].map(m => m[1] || m[2]);

        if (quotedParts.length === 0) {
            return new Response(JSON.stringify({ status: "error", message: "Could not parse dialogue into speaker turns." }), { status: 400, headers: { "Content-Type": "application/json" }});
        }

        let currentGender = 'female';
        for (let i = 0; i < quotedParts.length; i++) {
            const text = quotedParts[i].trim();
            if (text.length > 2) {
                dialogueLines.push({
                    text: text,
                    gender: currentGender,
                    voice: voiceMap[currentGender],
                    order: i
                });
                currentGender = currentGender === 'female' ? 'male' : 'female';
            }
        }

        const audioSegments = [];
        for (const line of dialogueLines) {
            const textHash = createHash('md5').update(`${line.text}_${language}_${line.voice}`).digest('hex');
            const cachedAudio = await base44.entities.GeneratedAudio.filter({ text_hash: textHash }, '-created_date', 1);

            if (cachedAudio.length > 0) {
                audioSegments.push({ audio_base64: cachedAudio[0].audio_base64, gender: line.gender, voice: line.voice, text: line.text, order: line.order });
                continue;
            }
            
            const openAIResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "tts-1", input: line.text, voice: line.voice })
            });

            if (openAIResponse.ok) {
                const audioData = await openAIResponse.arrayBuffer();
                const base64Audio = base64encode(audioData);
                await base44.entities.GeneratedAudio.create({ text_hash: textHash, text_content: line.text, language: language, gender: line.gender, audio_base64: base64Audio, openai_voice: line.voice });
                audioSegments.push({ audio_base64: base64Audio, gender: line.gender, voice: line.voice, text: line.text, order: line.order });
            } else {
                const errorText = await openAIResponse.text();
                return new Response(JSON.stringify({ status: "error", message: `TTS API failed for line: "${line.text}". Error: ${errorText}` }), { status: 500, headers: { "Content-Type": "application/json" }});
            }
        }

        audioSegments.sort((a, b) => a.order - b.order);

        if (audioSegments.length === 0) {
            return new Response(JSON.stringify({ status: "error", message: "Failed to generate any audio segments" }), { status: 500, headers: { "Content-Type": "application/json" }});
        }

        const voiceSequence = audioSegments.map(s => s.voice);
        const voiceInfo = voiceSequence.join(' → ');

        return new Response(JSON.stringify({ 
            status: "success",
            dialogue_segments: audioSegments,
            voice_sequence: voiceSequence,
            message: `Generated ${audioSegments.length} dialogue segments: ${voiceInfo}` 
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Function error:", error);
        return new Response(JSON.stringify({ status: "error", message: `Internal function error: ${error.message}` }), { status: 500, headers: { "Content-Type": "application/json" }});
    }
});