/**
 * API Endpoint pro generování AI popisků pro autoposting
 *
 * POST /api/generate-caption
 * Body: {
 *   holidayData?: object  // Aktuální data z areálu (volitelné - načte se z cache)
 * }
 *
 * Response: {
 *   success: boolean,
 *   caption: string,      // Vygenerovaný text (bez hashtagů)
 *   error?: string
 * }
 *
 * Requires: OPENAI_API_KEY environment variable
 */

import { createClient } from '@supabase/supabase-js';

// Supabase config (same as facebook-post.js)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtnchzadjrmgfvhfzpzh.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bmNoemFkanJtZ2Z2aGZ6cHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYyNDAsImV4cCI6MjA4MDQ1MjI0MH0.gaCkl1hs_RKpbtHbSOMGbkAa4dCPgh6erEq524lSDk0';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Czech day names
const DAY_NAMES = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const MONTH_NAMES = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'
];

/**
 * Fetch holiday info data from cache
 */
async function fetchHolidayInfoFromCache() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('holidayinfo_cache')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) {
      console.error('[Generate Caption] Failed to fetch holiday info cache:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('[Generate Caption] Error fetching holiday info:', e);
    return null;
  }
}

/**
 * Build context string from holiday data for AI prompt
 */
function buildDataContext(holidayInfo) {
  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const day = now.getDate();
  const month = MONTH_NAMES[now.getMonth()];

  const lines = [
    `Datum: ${dayName} ${day}. ${month}`,
    `Stav areálu: ${holidayInfo?.is_open ? 'OTEVŘENO' : 'ZAVŘENO'}`,
  ];

  if (holidayInfo?.temperature) {
    lines.push(`Teplota: ${holidayInfo.temperature}°C`);
  }
  if (holidayInfo?.weather) {
    lines.push(`Počasí: ${holidayInfo.weather}`);
  }
  if (holidayInfo?.snow_height) {
    lines.push(`Výška sněhu: ${holidayInfo.snow_height}`);
  }
  if (holidayInfo?.snow_type) {
    lines.push(`Typ sněhu: ${holidayInfo.snow_type}`);
  }
  if (holidayInfo?.new_snow) {
    lines.push(`Nový sníh: ${holidayInfo.new_snow}`);
  }
  if (holidayInfo?.opertime) {
    lines.push(`Provozní doba: ${holidayInfo.opertime}`);
  }

  // Lifts info
  const cableCarOpen = holidayInfo?.cable_car_open_count || 0;
  const dragLiftOpen = holidayInfo?.drag_lift_open_count || 0;
  lines.push(`Lanovky v provozu: ${cableCarOpen}`);
  lines.push(`Vleky v provozu: ${dragLiftOpen}`);

  // Slopes info
  const slopesOpen = holidayInfo?.slopes_open_count || 0;
  const slopesTotal = holidayInfo?.slopes_total_count || 9;
  lines.push(`Sjezdovky: ${slopesOpen}/${slopesTotal} otevřených`);

  // Owner's comment if available
  if (holidayInfo?.text_comment) {
    lines.push(`Poznámka od provozovatele: "${holidayInfo.text_comment}"`);
  }

  return lines.join('\n');
}

/**
 * Generate caption using OpenAI GPT-4o-mini
 */
async function generateWithOpenAI(dataContext, apiKey) {
  const systemPrompt = `Jsi kreativní copywriter pro lyžařský areál SKI CENTRUM KOHÚTKA v Beskydech.
Tvým úkolem je napsat krátký, lákavý příspěvek na Facebook/Instagram.

PRAVIDLA:
- Piš česky, přátelsky a pozitivně
- Délka 150-300 znaků (ideální pro sociální sítě)
- Začni dnem a datem přirozeně v textu
- Zahrň klíčové informace (počasí, sníh, sjezdovky)
- Motivuj lidi přijet lyžovat
- Použij 1-3 relevantní emoji
- NEPŘIDÁVEJ hashtags - ty se přidají automaticky
- NEPŘIDÁVEJ URL odkazy
- Buď originální - každý text by měl být jiný`;

  const userPrompt = `Napiš příspěvek na sociální sítě pro SKI CENTRUM KOHÚTKA na základě těchto aktuálních dat:

${dataContext}

Napiš pouze samotný text příspěvku, nic jiného.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.9, // Higher temperature for more variety
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const caption = data.choices?.[0]?.message?.content?.trim();

  if (!caption) {
    throw new Error('OpenAI returned empty response');
  }

  return caption;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // === Extended DEBUG for OPENAI_API_KEY ===
  console.log('[Generate Caption] === API KEY DEBUG ===');
  console.log('[Generate Caption] OPENAI_API_KEY:', apiKey
    ? `SET (length: ${apiKey.length}, first 10: "${apiKey.substring(0, 10)}", last 4: "${apiKey.substring(apiKey.length - 4)}")`
    : 'NOT SET');
  if (apiKey) {
    console.log('[Generate Caption] Key has spaces:', apiKey.includes(' '));
    console.log('[Generate Caption] Key has newlines:', apiKey.includes('\n') || apiKey.includes('\r'));
    console.log('[Generate Caption] Key starts with sk-:', apiKey.startsWith('sk-'));
  }
  console.log('[Generate Caption] All OPENAI vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
  console.log('[Generate Caption] All KEY vars:', Object.keys(process.env).filter(k => k.includes('KEY')));
  console.log('[Generate Caption] Total env vars:', Object.keys(process.env).length);
  console.log('[Generate Caption] ===================');

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'OpenAI API key not configured',
      hint: 'Set OPENAI_API_KEY environment variable',
    });
  }

  try {
    console.log('[Generate Caption] Starting caption generation...');

    // Fetch holiday data from cache (ignore any provided data for security)
    const holidayInfo = await fetchHolidayInfoFromCache();

    if (!holidayInfo) {
      return res.status(500).json({
        success: false,
        error: 'Could not fetch resort data',
      });
    }

    // Build context for AI
    const dataContext = buildDataContext(holidayInfo);
    console.log('[Generate Caption] Data context:', dataContext.substring(0, 100) + '...');

    // Generate caption with OpenAI
    const caption = await generateWithOpenAI(dataContext, apiKey);
    console.log('[Generate Caption] Generated:', caption.substring(0, 50) + '...');

    return res.status(200).json({
      success: true,
      caption,
    });
  } catch (error) {
    console.error('[Generate Caption] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
