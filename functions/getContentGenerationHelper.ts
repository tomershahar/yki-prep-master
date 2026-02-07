import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Helper function to route content generation to the appropriate test-specific function
 */

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

    const { testType, section, level, language, topic, wordCount, taskType } = await req.json();

    // Determine language from testType or language param
    let detectedLanguage = language;
    if (!detectedLanguage && testType) {
      // Fallback: infer from testType if language not provided
      if (testType === 'YKI') {
        detectedLanguage = 'finnish'; // Default for YKI
      } else if (testType === 'Swedex' || testType === 'TISUS' || testType === 'SFI') {
        detectedLanguage = 'swedish';
      } else if (testType === 'PD3' || testType === 'PD2') {
        detectedLanguage = 'danish';
      }
    }

    // Route to appropriate generation function
    let generationFunction;
    
    if (detectedLanguage === 'finnish') {
      generationFunction = 'generateFinnishContent';
    } else if (detectedLanguage === 'swedish') {
      generationFunction = 'generateSwedishContent';
    } else if (detectedLanguage === 'danish') {
      generationFunction = 'generateDanishContent';
    } else {
      return Response.json({ 
        error: `Cannot determine language for testType: ${testType}, language: ${language}` 
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Call the appropriate generation function
    const result = await base44.functions.invoke(generationFunction, {
      section,
      level,
      language: detectedLanguage,
      topic,
      wordCount,
      taskType
    });

    // Extract data from the function invocation result
    // The result from base44.functions.invoke is wrapped in { data, error }
    if (result.error) {
      return Response.json({ 
        error: result.error.message || result.error
      }, { 
        status: 500,
        headers: corsHeaders 
      });
    }

    // Return the data directly - it's already in the correct format
    return Response.json(result.data || result, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in content generation helper:', error);
    return Response.json({ 
      error: error.message || 'Failed to generate content' 
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
});