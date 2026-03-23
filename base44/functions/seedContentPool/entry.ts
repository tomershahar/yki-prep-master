import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Admin-only function to bulk-generate and store ContentPool items.
 * Input: { language?, section?, level?, count: number }
 * Omitting language/section/level means "all" for that dimension.
 */

// Map language to the correct generator function
function getGeneratorFunction(language: string): string | null {
  if (language === 'swedish') return 'generateSwedishContent';
  if (language === 'danish') return 'generateDanishContent';
  if (language === 'finnish') return 'generateFinnishContent';
  return null;
}

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

    // Admin guard
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const {
      language,
      section,
      level,
      count = 5
    } = body as { language: string; section: string; level: string; count?: number };

    if (!language || !section || !level) {
      return Response.json({ error: 'language, section, and level are required' }, { status: 400, headers: corsHeaders });
    }

    const generatorFunction = getGeneratorFunction(language);
    if (!generatorFunction) {
      return Response.json({ error: `No generator for language: ${language}` }, { status: 400, headers: corsHeaders });
    }

    const comboLabel = `${language}/${section}/${level}`;
    console.log(`[SeedPool] Seeding ${count} items for ${comboLabel}`);

    let totalSeeded = 0;
    const errors: { item: number; error: string }[] = [];

    for (let i = 0; i < count; i++) {
      try {
        const result = await base44.functions.invoke(generatorFunction, {
          section,
          level,
          language,
        });

        if (result.error) {
          throw new Error(result.error.message || String(result.error));
        }

        const content = result.data || result;

        await base44.entities.ContentPool.create({
          language,
          section,
          level,
          content,
          used_count: 0,
          is_active: true,
        });

        totalSeeded++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[SeedPool] Error seeding item ${i + 1} for ${comboLabel}:`, errorMsg);
        errors.push({ item: i + 1, error: errorMsg });
      }
    }

    console.log(`[SeedPool] Seeded ${totalSeeded}/${count} items for ${comboLabel}`);

    return Response.json({
      seeded: totalSeeded,
      combinations: 1,
      combo: comboLabel,
      errors,
      message: `Seeded ${totalSeeded}/${count} items for ${comboLabel}`
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[SeedPool] Fatal error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Failed to seed content pool'
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});
