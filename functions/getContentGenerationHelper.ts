import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Helper function to route content generation to the appropriate test-specific function.
 * Uses a pre-generated ContentPool to avoid calling OpenAI on every request.
 * Falls back to live AI generation only when the pool is exhausted.
 */

const LOW_POOL_THRESHOLD = 5;

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

    const { testType, section, level, language, topic, wordCount, taskType, situation } = await req.json();

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

    // --- POOL-FIRST LOGIC (wrapped in try/catch — any pool error falls through to live AI) ---
    try {
      // 1. Query pool for matching active items
      const poolItems = await base44.entities.ContentPool.filter({
        language: detectedLanguage,
        section,
        level,
        is_active: true
      });

      const seenIds: string[] = user.used_content_pool_ids || [];

      // 2. Filter out already-seen items
      let availableItems = (poolItems || []).filter((item) => !seenIds.includes(item.id));

      // 3. If all seen (cycle reset): clear seen IDs for this combo and retry
      if (availableItems.length === 0 && poolItems && poolItems.length > 0) {
        console.log(`[ContentPool] All items seen for ${detectedLanguage}/${section}/${level} — resetting seen list for this combo`);
        const filteredSeenIds = seenIds.filter((id) => {
          return !poolItems.some((item) => item.id === id);
        });
        await base44.auth.updateMe({ used_content_pool_ids: filteredSeenIds });
        availableItems = poolItems;
      }

      // 4. If pool has items, serve from pool
      if (availableItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableItems.length);
        const selected = availableItems[randomIndex];

        // Update user's seen list and increment used_count (non-blocking background updates)
        const updatedSeenIds = [...(user.used_content_pool_ids || []), selected.id];

        Promise.all([
          base44.auth.updateMe({ used_content_pool_ids: updatedSeenIds }),
          base44.entities.ContentPool.update(selected.id, { used_count: (selected.used_count || 0) + 1 })
        ]).catch((err) => console.error('[ContentPool] Error updating after pool serve:', err));

        // 5. If pool is running low, trigger background replenishment
        const remainingCount = availableItems.length - 1;
        if (remainingCount < LOW_POOL_THRESHOLD) {
          console.log(`[ContentPool] Low pool (${remainingCount} remaining) for ${detectedLanguage}/${section}/${level} — triggering background refill`);
          base44.functions.invoke('seedContentPool', {
            language: detectedLanguage,
            section,
            level,
            count: 15
          }).catch((err) => console.error('[ContentPool] Background seed failed:', err));
        }

        // content may be stored as an object or a JSON string — normalise
        const content = typeof selected.content === 'string'
          ? JSON.parse(selected.content)
          : selected.content;

        console.log(`[ContentPool] Served item ${selected.id} from pool (${availableItems.length} available)`);
        return Response.json(content, { headers: corsHeaders });
      }
    } catch (poolError) {
      // Pool is unavailable or misconfigured — log and fall through to live AI
      console.warn('[ContentPool] Pool lookup failed, falling back to live AI generation:', poolError.message);
    }

    // --- FALLBACK: Live AI generation ---
    console.log(`[ContentPool] Falling back to live AI generation for ${detectedLanguage}/${section}/${level}`);

    // Route to appropriate generation function based on detected language
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
      taskType,
      situation
    });

    // Extract data from the function invocation result
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
