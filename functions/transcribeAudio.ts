import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    // CORS headers
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
        
        // Check if user is authenticated
        if (!(await base44.auth.isAuthenticated())) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const { file_url, language } = await req.json();
        
        if (!file_url) {
            return new Response(JSON.stringify({ error: "file_url is required" }), { 
                status: 400, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const apiKey = Deno.env.get("OPENAI_API_KEY");
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
        
        console.log(`Transcribing audio from URL: ${file_url.substring(0, 50)}...`);
        
        // Download the audio file with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        let audioResponse;
        try {
            audioResponse = await fetch(file_url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'YKI-Prep-Master/1.0'
                }
            });
            clearTimeout(timeoutId);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error("Failed to fetch audio file:", fetchError);
            return new Response(JSON.stringify({ 
                error: `Failed to download audio file: ${fetchError.message}` 
            }), { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
        
        if (!audioResponse.ok) {
            return new Response(JSON.stringify({ 
                error: `Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}` 
            }), { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
        
        const audioBlob = await audioResponse.blob();
        console.log(`Audio file downloaded, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

        // Prepare form data for OpenAI Whisper
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.webm");
        formData.append("model", "whisper-1");
        
        // Add language hint for better accuracy
        const languageCode = language === 'finnish' ? 'fi' : language === 'swedish' ? 'sv' : null;
        if (languageCode) {
            formData.append("language", languageCode);
            console.log(`Using language code: ${languageCode} for ${language}`);
        } else {
            console.log(`No language code set, language param was: ${language}`);
        }

        console.log(`Sending to OpenAI Whisper API for ${language} transcription...`);
        
        // Call OpenAI Whisper API with timeout
        const whisperController = new AbortController();
        const whisperTimeoutId = setTimeout(() => whisperController.abort(), 60000); // 60 second timeout
        
        let whisperResponse;
        try {
            whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${apiKey}` 
                },
                body: formData,
                signal: whisperController.signal
            });
            clearTimeout(whisperTimeoutId);
        } catch (whisperError) {
            clearTimeout(whisperTimeoutId);
            console.error("OpenAI Whisper API request failed:", whisperError);
            return new Response(JSON.stringify({ 
                error: `Transcription service timeout: ${whisperError.message}` 
            }), { 
                status: 500, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const result = await whisperResponse.json();

        if (!whisperResponse.ok) {
            console.error("Whisper API Error:", result);
            const errorMessage = result.error?.message || `OpenAI API error: ${whisperResponse.status}`;
            return new Response(JSON.stringify({ error: errorMessage }), { 
                status: whisperResponse.status, 
                headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
        
        console.log(`Transcription completed successfully`);
        console.log(`Result text: "${result.text}"`);
        console.log(`Text length: ${result.text?.length || 0} chars`);
        
        return new Response(JSON.stringify({ 
            status: "success", 
            transcription: result.text || "",
            debug_info: {
                language_requested: language,
                audio_size: audioBlob.size,
                transcription_length: result.text?.length || 0
            }
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Transcription function error:", error);
        return new Response(JSON.stringify({ 
            error: `Internal transcription error: ${error.message}` 
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});