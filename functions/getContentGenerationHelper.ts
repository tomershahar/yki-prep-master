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

    // Route to appropriate generation function based on test type AND language
    let generationFunction;
    
    if (testType === 'YKI') {
      // YKI can be Finnish or Swedish - route based on language
      if (language === 'swedish') {
        generationFunction = 'generateSwedishContent';
      } else if (language === 'danish') {
        generationFunction = 'generateDanishContent';
      } else {
        // For Finnish, we need to use the inline generation (no separate function exists)
        // Fall back to returning an error for now
        return Response.json({ 
          error: 'YKI Finnish content generation not yet implemented as a separate function' 
        }, { 
          status: 501, 
          headers: corsHeaders 
        });
      }
    } else if (testType === 'Swedex' || testType === 'TISUS' || testType === 'SFI') {
      generationFunction = 'generateSwedishContent';
    } else if (testType === 'PD3' || testType === 'PD2') {
      generationFunction = 'generateDanishContent';
    } else {
      return Response.json({ 
        error: `Unknown test type: ${testType}` 
      }, { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Call the appropriate generation function
    const result = await base44.functions.invoke(generationFunction, {
      section,
      level,
      language,
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