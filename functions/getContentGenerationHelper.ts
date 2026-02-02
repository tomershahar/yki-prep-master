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

    const { testType, section, level, topic, wordCount, taskType } = await req.json();

    // Route to appropriate generation function based on test type
    let generationFunction;
    switch (testType) {
      case 'YKI':
        // Use existing YKI generation logic (Finnish/Swedish)
        generationFunction = 'generateYKIContent'; // This would be your existing function
        break;
      case 'Swedex':
      case 'TISUS':
      case 'SFI':
        generationFunction = 'generateSwedishContent';
        break;
      case 'PD3':
      case 'PD2':
        generationFunction = 'generateDanishContent';
        break;
      default:
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
      topic,
      wordCount,
      taskType
    });

    return Response.json(result, { headers: corsHeaders });

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