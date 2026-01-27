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
  // Prague timezone
  const pragueTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const hour = pragueTime.getHours();

  const dayName = DAY_NAMES[pragueTime.getDay()];
  const day = pragueTime.getDate();
  const month = MONTH_NAMES[pragueTime.getMonth()];

  // Denní doba pro pozdrav
  let denniDoba;
  if (hour >= 5 && hour < 12) denniDoba = 'ráno';
  else if (hour >= 12 && hour < 18) denniDoba = 'odpoledne';
  else denniDoba = 'večer';

  // Parse numeric values
  const snowHeightNum = parseInt(holidayInfo?.snow_height) || 0;
  const newSnowNum = parseInt(holidayInfo?.new_snow) || 0;

  const lines = [
    `- Datum a čas: ${dayName} ${day}. ${month}, ${denniDoba}`,
    `- Teplota: ${holidayInfo?.temperature || '?'}°C`,
    `- Počasí: ${holidayInfo?.weather || 'neznámé'}`,
    `- Výška sněhu na sjezdovkách: ${snowHeightNum} cm`,
    `- Nový sníh (za posledních 24h): ${newSnowNum} cm`,
    `- Počet otevřených vleků: ${holidayInfo?.drag_lift_open_count || 0}`,
    `- Počet otevřených lanovek: ${holidayInfo?.cable_car_open_count || 0}`,
  ];

  if (holidayInfo?.text_comment) {
    lines.push(`- Poznámka provozovatele: "${holidayInfo.text_comment}"`);
  }

  return lines.join('\n');
}

/**
 * Generate caption using OpenAI GPT-4o
 */
async function generateWithOpenAI(dataContext, apiKey) {
  const systemPrompt = `Jsi správce sociálních sítí lyžařského střediska SKI CENTRUM KOHÚTKA. Na základě poskytnutých dat vygeneruj přátelský a motivační Facebook příspěvek v češtině.

## Pravidla hodnocení podmínek
### Kategorie VÝBORNÉ (použij nadšený tón, emoji ⭐🎿❄️):
- Nový sníh > 15 cm NEBO
- Výška sněhu > 80 cm A počasí jasno/polojasno A teplota mezi -10°C a -2°C

### Kategorie VELMI DOBRÉ (použij pozitivní tón, emoji 👍🎿):
- Nový sníh 5-15 cm NEBO
- Výška sněhu 50-80 cm A počasí bez deště A teplota mezi -15°C a 0°C

### Kategorie DOBRÉ (použij povzbudivý tón, emoji 🎿):
- Výška sněhu 30-50 cm A počasí bez deště
- Teplota mezi -20°C a +3°C

### Kategorie PŘIJATELNÉ (buď upřímný, zmiň omezení):
- Výška sněhu 20-30 cm NEBO
- Teplota nad 3°C (upozorni na měkký sníh) NEBO
- Mlha (upozorni na sníženou viditelnost)

### Kategorie NEPŘÍZNIVÉ (odraď zdvořile, navrhni alternativu):
- Výška sněhu < 20 cm NEBO
- Déšť NEBO
- Teplota pod -20°C NEBO
- Silný vítr

## Struktura příspěvku
1. Pozdrav podle denní doby (ráno/odpoledne/večer)
2. Hlavní informace o podmínkách (1-2 věty)
3. Klíčová data ve formátu:
   🌡️ Teplota: X°C
   ❄️ Sníh: X cm (nový: X cm)
   🚡 Provoz: X lanovek, X vleků
4. Motivační výzva nebo doporučení
- NEPŘIDÁVEJ hashtagy - ty se přidají automaticky z nastavení

## Tón komunikace
- Přátelský, ale profesionální
- Upřímný o podmínkách (nezkrášluj špatné počasí)
- Používej emoji střídmě (max 5-7 na příspěvek)
- Délka: 150-300 znaků bez hashtagů

## Příklady frází podle počasí
- Jasno: "Slunce svítí, sjezdovky volají!"
- Sněžení: "Čerstvý prašan je tu pro vás!"
- Mlha: "Dnes spíše pro odvážné – viditelnost je omezená."
- Mráz pod -15°C: "Oblečte se do vrstev, mrzne až praští!"
- Obleva: "Sníh měkne, ideální pro pohodovou jízdu."`;

  const userPrompt = `Vygeneruj příspěvek pro tyto podmínky:

${dataContext}

Napiš pouze samotný text příspěvku, bez hashtagů.`;

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.8,
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
