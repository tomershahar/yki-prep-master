import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Admin-only function to bulk-generate and store ContentPool items.
 * Input: { language?, section?, level?, count: number }
 * Omitting language/section/level means "all" for that dimension.
 */

const ALL_LANGUAGES = ['swedish', 'danish'];
const ALL_SECTIONS = ['reading', 'listening', 'speaking', 'writing'];
const ALL_LEVELS = ['A1', 'A2', 'B1', 'B2'];

// Map language+testType to the correct generator function
function getGeneratorFunction(language: string): string | null {
  if (language === 'swedish') return 'generateSwedishContent';
  if (language === 'danish') return 'generateDanishContent';
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
      count = 15
    } = body as { language?: string; section?: string; level?: string; count?: number };

    // Build combinations to seed
    const languages = language ? [language] : ALL_LANGUAGES;
    const sections = section ? [section] : ALL_SECTIONS;
    const levels = level ? [level] : ALL_LEVELS;

    let totalSeeded = 0;
    let totalCombinations = 0;
    const errors: { combo: string; error: string }[] = [];

    for (const lang of languages) {
      const generatorFunction = getGeneratorFunction(lang);
      if (!generatorFunction) {
        console.warn(`[SeedPool] No generator for language: ${lang}, skipping`);
        continue;
      }

      for (const sec of sections) {
        for (const lvl of levels) {
          totalCombinations++;
          const comboLabel = `${lang}/${sec}/${lvl}`;
          console.log(`[SeedPool] Seeding ${count} items for ${comboLabel}`);

          let seededForCombo = 0;

          for (let i = 0; i < count; i++) {
            try {
              const result = await base44.functions.invoke(generatorFunction, {
                section: sec,
                level: lvl,
                language: lang,
              });

              if (result.error) {
                throw new Error(result.error.message || String(result.error));
              }

              const content = result.data || result;

              // Save to ContentPool entity
              await base44.entities.ContentPool.create({
                language: lang,
                section: sec,
                level: lvl,
                content,
                used_count: 0,
                is_active: true,
              });

              seededForCombo++;
              totalSeeded++;
            } catch (err) {
              const errorMsg = err instanceof Error ? err.message : String(err);
              console.error(`[SeedPool] Error seeding item ${i + 1} for ${comboLabel}:`, errorMsg);
              errors.push({ combo: `${comboLabel} item ${i + 1}`, error: errorMsg });
            }
          }

          console.log(`[SeedPool] Seeded ${seededForCombo}/${count} items for ${comboLabel}`);
        }
      }
    }

    return Response.json({
      seeded: totalSeeded,
      combinations: totalCombinations,
      errors,
      message: `Seeded ${totalSeeded} items across ${totalCombinations} combinations`
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
