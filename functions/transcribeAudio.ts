import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": Deno.env.get("APP_URL") || "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };
    
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);
        
        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const { audio_base64, file_url, language } = await req.json();

        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        let audioBlob;

        if (audio_base64) {
            // Convert base64 to binary
            const base64Data = audio_base64.includes(',') ? audio_base64.split(',')[1] : audio_base64;
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            audioBlob = new Blob([bytes], { type: 'audio/webm' });
            console.log(`Audio from base64, size: ${audioBlob.size} bytes`);
        } else if (file_url) {
            const audioResponse = await fetch(file_url);
            if (!audioResponse.ok) {
                return new Response(JSON.stringify({ error: `Failed to fetch audio: ${audioResponse.status}` }), { 
                    status: 500, 
                    headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
            audioBlob = await audioResponse.blob();
            console.log(`Audio from URL, size: ${audioBlob.size} bytes`);
        } else {
            return new Response(JSON.stringify({ error: "audio_base64 or file_url is required" }), { 
                status: 400, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");
        formData.append("model", "whisper-1");
        
        const languageCode = language === 'finnish' ? 'fi' : language === 'swedish' ? 'sv' : null;
        if (languageCode) {
            formData.append("language", languageCode);
        }

        const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}` },
            body: formData,
        });

        const result = await whisperResponse.json();

        if (!whisperResponse.ok) {
            console.error("Whisper API Error:", result);
            return new Response(JSON.stringify({ error: result.error?.message || `OpenAI API error: ${whisperResponse.status}` }), { 
                status: whisperResponse.status, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
        
        console.log(`Transcription completed: "${result.text}"`);
        
        return new Response(JSON.stringify({ 
            status: "success", 
            transcription: result.text || "",
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Transcription function error:", error);
        return new Response(JSON.stringify({ error: `Internal transcription error: ${error.message}` }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});