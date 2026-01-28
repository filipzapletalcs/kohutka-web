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
 *   rawCaption?: string,  // Původní text před korekcí (pro debug)
 *   error?: string
 * }
 *
 * Pipeline: GPT-4o (generátor) → GPT-4o (korektor) → Supabase (historie)
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

/**
 * Načte posledních N captionů z historie pro kontrolu opakování
 */
async function getRecentCaptions(supabase, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('generated_captions')
      .select('caption')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Generate Caption] Failed to fetch recent captions:', error.message);
      return [];
    }

    return data?.map(r => r.caption) || [];
  } catch (e) {
    console.error('[Generate Caption] Error fetching recent captions:', e);
    return [];
  }
}

/**
 * Uloží vygenerovaný caption do historie
 */
async function saveCaption(supabase, caption, weatherData) {
  try {
    const { error } = await supabase
      .from('generated_captions')
      .insert({
        caption,
        weather_data: weatherData,
        was_published: false
      });

    if (error) {
      console.error('[Generate Caption] Failed to save caption:', error.message);
    }
  } catch (e) {
    console.error('[Generate Caption] Error saving caption:', e);
  }
}

/**
 * Korektor - kontroluje a opravuje text s ohledem na historii
 */
async function proofreadCaption(caption, recentCaptions, apiKey) {
  const historyContext = recentCaptions.length > 0
    ? `\n\nNEDÁVNÉ PŘÍSPĚVKY (vyhni se podobným formulacím):\n${recentCaptions.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
    : '';

  const systemPrompt = `Jsi korektor českých Facebook příspěvků pro lyžařské středisko Kohútka.

TVŮJ ÚKOL:
1. Oprav gramatické a stylistické chyby
2. Zkontroluj smysluplnost každé věty
3. DŮLEŽITÉ: Text nesmí být příliš podobný nedávným příspěvkům${historyContext ? ' (viz níže)' : ''}
   - Pokud je podobný, změň úvodní formulace
   - Zachovej faktická data (teplota, sníh, vleky)

PRAVIDLA:
- Zachovej délku 150-250 znaků
- Max 3 emoji (🌡️ ❄️ 🚡)
- Žádné hashtagy
- Vrať POUZE opravený text${historyContext}`;

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
        { role: 'user', content: `Zkontroluj a oprav tento text:\n\n${caption}` },
      ],
      max_tokens: 300,
      temperature: 0.3, // Nižší teplota pro konzistentní korekce
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Generate Caption] Proofreader error:', errorData);
    // Při chybě vrátíme původní text
    return caption;
  }

  const data = await response.json();
  const corrected = data.choices?.[0]?.message?.content?.trim();

  return corrected || caption;
}

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
 * Analyzuje detailní data o sjezdovkách
 */
function analyzeSlopesData(slopesDetailed) {
  if (!Array.isArray(slopesDetailed) || slopesDetailed.length === 0) {
    return null;
  }

  const openSlopes = slopesDetailed.filter(s => s.status_code === 2);
  const closedSlopes = slopesDetailed.filter(s => s.status_code === 3);

  // Rozdělit podle obtížnosti
  const easy = openSlopes.filter(s => s.diff_code === 1);
  const medium = openSlopes.filter(s => s.diff_code === 2);
  const hard = openSlopes.filter(s => s.diff_code === 3);

  // Najít nejdelší otevřenou sjezdovku
  const longest = openSlopes.reduce((max, s) => s.length > (max?.length || 0) ? s : max, null);

  // Najít sjezdovku s největším převýšením
  const steepest = openSlopes.reduce((max, s) => s.exceed > (max?.exceed || 0) ? s : max, null);

  return {
    open: openSlopes,
    closed: closedSlopes,
    byDifficulty: { easy, medium, hard },
    longest,
    steepest,
    openNames: openSlopes.map(s => s.name),
    closedNames: closedSlopes.map(s => s.name)
  };
}

/**
 * Analyzuje detailní data o vlecích
 */
function analyzeLiftsData(liftsDetailed) {
  if (!Array.isArray(liftsDetailed) || liftsDetailed.length === 0) {
    return null;
  }

  const openLifts = liftsDetailed.filter(l => l.status_code === 1);
  const chairlift = openLifts.find(l => l.type_code === 4); // čtyřsedačka
  const sunkid = openLifts.find(l => l.type_code === 7); // dětský pás

  return {
    open: openLifts,
    chairlift,
    sunkid,
    openNames: openLifts.map(l => l.name)
  };
}

/**
 * Vybere náhodný "tip dne" na základě aktuálních dat
 */
function generateDailyTip(slopesAnalysis, liftsAnalysis, holidayInfo) {
  const tips = [];

  // Tip pro začátečníky
  if (slopesAnalysis?.byDifficulty.easy.length >= 2) {
    const easyNames = slopesAnalysis.byDifficulty.easy.slice(0, 2).map(s => s.name).join(' a ');
    tips.push(`Pro začátečníky doporučujeme sjezdovky ${easyNames}`);
  }

  // Tip pro pokročilé
  if (slopesAnalysis?.byDifficulty.hard.length > 0) {
    const hardSlope = slopesAnalysis.byDifficulty.hard[0];
    tips.push(`Pro pokročilé: ${hardSlope.name} (${hardSlope.length}m, převýšení ${hardSlope.exceed}m)`);
  }

  // Tip na nejdelší sjezdovku
  if (slopesAnalysis?.longest && slopesAnalysis.longest.length >= 800) {
    tips.push(`Nejdelší otevřená sjezdovka: ${slopesAnalysis.longest.name} (${slopesAnalysis.longest.length}m)`);
  }

  // Tip na lanovku
  if (liftsAnalysis?.chairlift) {
    tips.push(`Čtyřsedačková lanovka ${liftsAnalysis.chairlift.name} v provozu`);
  }

  // Tip pro rodiny s dětmi
  if (holidayInfo?.skipark_open && liftsAnalysis?.sunkid) {
    tips.push('Dětský skipark otevřen - ideální pro nejmenší lyžaře');
  }

  // Tip na typ sněhu
  if (holidayInfo?.snow_type) {
    const snowDesc = {
      'technický': 'Technický sníh dobře drží hranu',
      'přírodní': 'Přírodní sníh - parádní podmínky',
      'firn': 'Firn - ideální pro ranní carvingové oblouky',
      'mokrý': 'Mokrý sníh - opatrně v zatáčkách'
    };
    if (snowDesc[holidayInfo.snow_type.toLowerCase()]) {
      tips.push(snowDesc[holidayInfo.snow_type.toLowerCase()]);
    }
  }

  // Vrať náhodný tip
  if (tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Build context string from holiday data for AI prompt
 * Rozšířená verze s detailními daty o sjezdovkách a vlecích
 * @param {object} holidayInfo - Data z HolidayInfo cache
 * @param {number} [testHour] - Volitelný parametr pro testování (simuluje hodinu)
 * @param {string} [testDate] - Volitelný ISO datum pro testování (např. "2025-01-15")
 */
function buildDataContext(holidayInfo, testHour = null, testDate = null) {
  // Použij testDate pokud je zadán, jinak aktuální čas
  const now = testDate ? new Date(testDate) : new Date();
  // Prague timezone
  const pragueTime = testDate ? now : new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  // Použij testHour pokud je zadán (pro testování), jinak reálnou hodinu
  const hour = testHour !== null ? testHour : pragueTime.getHours();

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

  // Analyzuj detailní data
  const slopesAnalysis = analyzeSlopesData(holidayInfo?.slopes_detailed);
  const liftsAnalysis = analyzeLiftsData(holidayInfo?.lifts_detailed);

  // Základní info
  const lines = [
    `ZÁKLADNÍ ÚDAJE:`,
    `- Datum a čas: ${dayName} ${day}. ${month}, ${denniDoba}`,
    `- Provozní doba: ${holidayInfo?.opertime || 'neznámá'}`,
    `- Teplota: ${holidayInfo?.temperature || '?'}°C`,
    `- Počasí: ${holidayInfo?.weather || 'neznámé'}`,
    `- Výška sněhu: ${holidayInfo?.snow_height || snowHeightNum + ' cm'}`,
    `- Typ sněhu: ${holidayInfo?.snow_type || 'neznámý'}`,
  ];

  if (newSnowNum > 0) {
    lines.push(`- Nový sníh za 24h: ${newSnowNum} cm`);
  }

  // Info o sjezdovkách
  if (slopesAnalysis) {
    lines.push('');
    lines.push('SJEZDOVKY:');
    lines.push(`- Otevřeno: ${slopesAnalysis.open.length}/${holidayInfo?.slopes_total_count || slopesAnalysis.open.length + slopesAnalysis.closed.length}`);

    if (slopesAnalysis.byDifficulty.easy.length > 0) {
      lines.push(`- Lehké (modré): ${slopesAnalysis.byDifficulty.easy.map(s => s.name).join(', ')}`);
    }
    if (slopesAnalysis.byDifficulty.medium.length > 0) {
      lines.push(`- Střední (červené): ${slopesAnalysis.byDifficulty.medium.map(s => s.name).join(', ')}`);
    }
    if (slopesAnalysis.byDifficulty.hard.length > 0) {
      lines.push(`- Těžké (černé): ${slopesAnalysis.byDifficulty.hard.map(s => s.name).join(', ')}`);
    }
    if (slopesAnalysis.closedNames.length > 0) {
      lines.push(`- Zavřené: ${slopesAnalysis.closedNames.join(', ')}`);
    }
  }

  // Info o vlecích
  if (liftsAnalysis) {
    lines.push('');
    lines.push('VLEKY A LANOVKY:');
    lines.push(`- Otevřeno: ${liftsAnalysis.open.length}/${holidayInfo?.lifts_total_count || 0}`);
    lines.push(`- V provozu: ${liftsAnalysis.openNames.join(', ')}`);
    if (liftsAnalysis.chairlift) {
      lines.push(`- Čtyřsedačka "${liftsAnalysis.chairlift.name}" jede`);
    }
  }

  // Speciální info
  lines.push('');
  lines.push('SPECIÁLNÍ INFO:');
  if (holidayInfo?.skipark_open) {
    lines.push('- Dětský skipark OTEVŘEN');
  }

  // Sníh mimo sjezdovky (zajímavý fakt)
  if (holidayInfo?.snow_outside_slopes && parseInt(holidayInfo.snow_outside_slopes) > 0) {
    lines.push(`- Sníh mimo sjezdovky: ${holidayInfo.snow_outside_slopes} cm`);
  }

  // Ranní teplota (pokud se liší od aktuální)
  if (holidayInfo?.temp_morning && holidayInfo?.temperature) {
    const tempMorning = parseFloat(holidayInfo.temp_morning);
    const tempNow = parseFloat(holidayInfo.temperature);
    if (!isNaN(tempMorning) && !isNaN(tempNow) && Math.abs(tempMorning - tempNow) > 2) {
      lines.push(`- Ráno bylo ${tempMorning}°C, teď ${tempNow}°C`);
    }
  }

  // Tip dne (náhodný pro variabilitu)
  const dailyTip = generateDailyTip(slopesAnalysis, liftsAnalysis, holidayInfo);
  if (dailyTip) {
    lines.push(`- TIP DNE: ${dailyTip}`);
  }

  // Poznámka provozovatele (SUPER DŮLEŽITÉ - často obsahuje zajímavé info)
  if (holidayInfo?.text_comment) {
    lines.push('');
    lines.push(`POZNÁMKA PROVOZOVATELE (využij kreativně): "${holidayInfo.text_comment}"`);
  }

  return lines.join('\n');
}

/**
 * Generate caption using OpenAI GPT-4o
 */
async function generateWithOpenAI(dataContext, apiKey) {
  const systemPrompt = `Jsi správce Facebooku lyžařského střediska SKI CENTRUM KOHÚTKA.

TVŮJ ÚKOL:
1. Projdi všechna poskytnutá data
2. VYBER 1-2 NEJZAJÍMAVĚJŠÍ informace pro dnešní příspěvek
3. Napiš krátký, autentický příspěvek

STRUKTURA PŘÍSPĚVKU:
1. ÚVOD S DNEM (povinný): Vždy začni dnem a denní dobou, např:
   - "Úterní ráno na Kohútce!"
   - "Sobotní odpoledne plné sněhu!"
2. HLAVNÍ SDĚLENÍ: 1-2 věty založené na zajímavých datech
3. TECHNICKÉ ÚDAJE: Vyber relevantní data (teplota, sníh, vleky...) s emoji 🌡️ ❄️ 🚡

CO MŮŽE BÝT ZAJÍMAVÉ (vyber si):
- Poznámka provozovatele (text_comment)
- Konkrétní sjezdovka jménem (Velká A, Babská, Malá...)
- Typ sněhu (technický = drží hranu, přírodní = prašan)
- Čtyřsedačka Velká Kohútka
- Dětský skipark
- Nový sníh (pokud napadl)
- Změna teploty přes den

STYL:
- Délka: 150-250 znaků
- Emoji pouze u technických dat
- BEZ hashtagů
- Piš věcně a přátelsky`;

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
    // Volitelné testovací parametry (simuluje hodinu a datum)
    const { testHour, testDate } = req.body || {};
    const validTestHour = typeof testHour === 'number' && testHour >= 0 && testHour <= 23 ? testHour : null;
    const validTestDate = typeof testDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(testDate) ? testDate : null;

    console.log('[Generate Caption] Starting caption generation with proofreader pipeline...');
    if (validTestHour !== null || validTestDate !== null) {
      console.log(`[Generate Caption] Test mode: hour=${validTestHour ?? 'now'}, date=${validTestDate ?? 'today'}`);
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch holiday data from cache (ignore any provided data for security)
    const holidayInfo = await fetchHolidayInfoFromCache();

    if (!holidayInfo) {
      return res.status(500).json({
        success: false,
        error: 'Could not fetch resort data',
      });
    }

    // 1. Načti historii pro kontrolu opakování
    const recentCaptions = await getRecentCaptions(supabase, 20);
    console.log(`[Generate Caption] Loaded ${recentCaptions.length} recent captions for context`);

    // 2. Build context for AI (s volitelnými testovacími parametry)
    const dataContext = buildDataContext(holidayInfo, validTestHour, validTestDate);
    console.log('[Generate Caption] Data context:', dataContext.substring(0, 100) + '...');

    // 3. Generate raw caption with OpenAI (generátor)
    const rawCaption = await generateWithOpenAI(dataContext, apiKey);
    console.log('[Generate Caption] Raw caption:', rawCaption.substring(0, 50) + '...');

    // 4. Proofread caption with history context (korektor)
    const finalCaption = await proofreadCaption(rawCaption, recentCaptions, apiKey);
    console.log('[Generate Caption] Final caption:', finalCaption.substring(0, 50) + '...');

    // 5. Save to history (async, don't wait)
    const weatherSnapshot = {
      temperature: holidayInfo.temperature,
      weather: holidayInfo.weather,
      snow_height: holidayInfo.snow_height,
      new_snow: holidayInfo.new_snow,
      drag_lift_open_count: holidayInfo.drag_lift_open_count,
      cable_car_open_count: holidayInfo.cable_car_open_count,
      generated_at: new Date().toISOString()
    };
    saveCaption(supabase, finalCaption, weatherSnapshot);

    return res.status(200).json({
      success: true,
      caption: finalCaption,
      rawCaption: rawCaption !== finalCaption ? rawCaption : undefined, // Pro debug
    });
  } catch (error) {
    console.error('[Generate Caption] Error:', error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
