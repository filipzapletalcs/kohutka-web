/**
 * API endpoint pro cachování ceníku z Google Sheets
 *
 * Endpoint: /api/pricing?category=denni|casove|sezonni|jednotlive|bodove|ostatni|info_vek|info_dulezite|slevy
 *
 * Cache TTL: 1 hodina (konfigurovatelné přes PRICING_CACHE_TTL env variable)
 * Cache je persistentní - uložená na disku, přežije restart serveru
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// In-memory cache
const cache = new Map();

// Cache TTL v milisekundách (default: 1 hodina)
const CACHE_TTL = parseInt(process.env.PRICING_CACHE_TTL) || 60 * 60 * 1000;

// Cesta k souboru s cache
const CACHE_FILE = join(__dirname, '..', '.cache', 'pricing-cache.json');

/**
 * Načte cache ze souboru při startu
 */
const loadCacheFromDisk = async () => {
  try {
    if (existsSync(CACHE_FILE)) {
      const data = await readFile(CACHE_FILE, 'utf-8');
      const cacheData = JSON.parse(data);

      // Obnov cache do Map
      for (const [key, value] of Object.entries(cacheData)) {
        cache.set(key, value);
      }

      console.log(`✓ Cache načtena ze souboru (${cache.size} kategorií)`);
    } else {
      console.log('ℹ Cache soubor neexistuje, začínám s prázdnou cache');
    }
  } catch (error) {
    console.error('⚠ Chyba při načítání cache ze souboru:', error);
    // Pokračujeme s prázdnou cache
  }
};

/**
 * Uloží cache do souboru
 */
const saveCacheToDisk = async () => {
  try {
    // Vytvoř .cache složku pokud neexistuje
    const cacheDir = dirname(CACHE_FILE);
    if (!existsSync(cacheDir)) {
      await mkdir(cacheDir, { recursive: true });
    }

    // Převeď Map na obyčejný objekt
    const cacheData = Object.fromEntries(cache.entries());

    // Ulož do souboru
    await writeFile(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');

    console.log(`✓ Cache uložena do souboru (${cache.size} kategorií)`);
  } catch (error) {
    console.error('⚠ Chyba při ukládání cache do souboru:', error);
  }
};

// Načti cache při startu
await loadCacheFromDisk();

// Ulož cache každých 5 minut (pro případ pádu serveru)
setInterval(saveCacheToDisk, 5 * 60 * 1000);

/**
 * Proaktivní refresh všech kategorií ceníku
 * Volá se automaticky každou hodinu, aby cache byla vždy čerstvá
 */
const proactiveRefreshAllCategories = async () => {
  console.log('\n🔄 Proaktivní refresh cache - začínám...');

  // Debug: vypíš env proměnné
  console.log('📋 PRICING_SHEET_URLS:', JSON.stringify(PRICING_SHEET_URLS, null, 2));

  const categories = Object.keys(PRICING_SHEET_URLS);
  console.log(`📋 Kategorie k refreshi: ${categories.join(', ')}`);

  let successCount = 0;
  let errorCount = 0;

  for (const category of categories) {
    try {
      const url = PRICING_SHEET_URLS[category];
      console.log(`  → ${category}: ${url ? 'URL OK' : 'URL PRÁZDNÁ!'}`);
      if (!url) continue;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'text/csv' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const csvText = await response.text();
      if (!csvText || csvText.trim() === '') {
        throw new Error('Prázdná odpověď');
      }

      // Parsuj data podle typu
      let data;
      if (category === 'info_vek') {
        // Speciální parser pro věkové kategorie
        const lines = csvText.trim().split('\n').slice(1);
        const cats = {};
        for (const line of lines) {
          if (!line.trim()) continue;
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const cat = values[0]?.toLowerCase();
          if (cat) {
            cats[cat] = { category: cat, name: values[1], birthYears: values[2] };
          }
        }
        data = {
          adult: cats.adult || { category: 'adult', name: 'Dospělí', birthYears: '1961-2007' },
          child: cats.child || { category: 'child', name: 'Děti', birthYears: '2015 a mladší' },
          junior: cats.junior || { category: 'junior', name: 'Junioři', birthYears: '2006-2014' },
          senior: cats.senior || { category: 'senior', name: 'Senioři', birthYears: '1960 a starší' },
        };
      } else {
        // Standardní parser pro ceníky
        const lines = csvText.trim().split('\n').slice(1);
        data = [];
        for (const line of lines) {
          if (!line.trim()) continue;
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          data.push({
            name: values[0] || '',
            adult: values[1] ? (isNaN(parseFloat(values[1])) ? values[1] : parseFloat(values[1])) : undefined,
            child: values[2] ? (isNaN(parseFloat(values[2])) ? values[2] : parseFloat(values[2])) : undefined,
            junior: values[3] ? (isNaN(parseFloat(values[3])) ? values[3] : parseFloat(values[3])) : undefined,
            senior: values[4] ? (isNaN(parseFloat(values[4])) ? values[4] : parseFloat(values[4])) : undefined,
            all: values[5] ? (isNaN(parseFloat(values[5])) ? values[5] : parseFloat(values[5])) : undefined,
            isHeader: values[6]?.toUpperCase() === 'ANO',
            note: values[7] || undefined,
          });
        }
      }

      // Ulož do cache
      cache.set(`pricing_${category}`, { data, timestamp: Date.now() });
      successCount++;
    } catch (error) {
      console.error(`  ✗ Chyba při refresh "${category}":`, error.message);
      errorCount++;
    }
  }

  // Ulož do souboru
  await saveCacheToDisk();
  console.log(`✅ Proaktivní refresh dokončen: ${successCount} úspěšných, ${errorCount} chyb\n`);
};

// Proaktivní refresh každou hodinu
const PROACTIVE_REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hodina
setInterval(proactiveRefreshAllCategories, PROACTIVE_REFRESH_INTERVAL);

// Spusť první refresh 10 sekund po startu serveru (aby se načetla čerstvá data)
setTimeout(proactiveRefreshAllCategories, 10 * 1000);

// Graceful shutdown - ulož cache při ukončení serveru
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, saving cache...');
  await saveCacheToDisk();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, saving cache...');
  await saveCacheToDisk();
  process.exit(0);
});

// Google Sheets URLs z environment variables - VŠECHNY kategorie
const PRICING_SHEET_URLS = {
  denni: process.env.VITE_PRICING_DENNI_URL || '',
  casove: process.env.VITE_PRICING_CASOVE_URL || '',
  sezonni: process.env.VITE_PRICING_SEZONNI_URL || '',
  jednotlive: process.env.VITE_PRICING_JEDNOTLIVE_URL || '',
  bodove: process.env.VITE_PRICING_BODOVE_URL || '',
  ostatni: process.env.VITE_PRICING_OSTATNI_URL || '',
  info_vek: process.env.VITE_PRICING_INFO_VEK_URL || '',
  info_dulezite: process.env.VITE_PRICING_INFO_DULEZITE_URL || '',
  slevy: process.env.VITE_PRICING_SLEVY_URL || '',
};

/**
 * Parsuje CSV řádek s ohledem na quoted values
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
};

/**
 * Převede hodnotu z CSV na číslo nebo string
 */
const parseValue = (value) => {
  if (!value || value === '') return undefined;

  // Pokud hodnota obsahuje písmena (kromě číslic), je to text
  const hasLetters = /[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(value);

  if (hasLetters) {
    return value;
  }

  // Pokud je to čisté číslo, vrátíme number
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) return numValue;

  return value;
};

/**
 * Parsuje CSV text na PriceRow[]
 */
const parseCSVToPriceRows = (csvText) => {
  const lines = csvText.trim().split('\n');
  const dataLines = lines.slice(1); // Přeskočíme header

  const rows = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const values = parseCSVLine(line);

    // Struktura CSV:
    // 0: Název jízdenky
    // 1: Dospělí
    // 2: Děti
    // 3: Junioři
    // 4: Senioři
    // 5: Všechny
    // 6: Je header (ANO/NE)
    // 7: Poznámka

    const isHeader = values[6]?.toUpperCase() === 'ANO';

    const row = {
      name: values[0] || '',
      adult: parseValue(values[1]),
      child: parseValue(values[2]),
      junior: parseValue(values[3]),
      senior: parseValue(values[4]),
      all: parseValue(values[5]),
      isHeader,
      note: values[7] || undefined,
    };

    rows.push(row);
  }

  return rows;
};

/**
 * Parsuje CSV věkových kategorií na AgeCategoriesData
 */
const parseAgeCategoriesCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const dataLines = lines.slice(1); // Přeskočíme header

  const categories = {};

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const values = parseCSVLine(line);

    // Struktura: Kategorie, Název, Narození
    const category = values[0]?.trim().toLowerCase();
    const name = values[1]?.trim();
    const birthYears = values[2]?.trim();

    if (category && name && birthYears) {
      categories[category] = {
        category,
        name,
        birthYears,
      };
    }
  }

  // Fallback pokud nějaká kategorie chybí
  return {
    adult: categories.adult || { category: 'adult', name: 'Dospělí', birthYears: '1961-2007' },
    child: categories.child || { category: 'child', name: 'Děti', birthYears: '2015 a mladší' },
    junior: categories.junior || { category: 'junior', name: 'Junioři', birthYears: '2006-2014' },
    senior: categories.senior || { category: 'senior', name: 'Senioři', birthYears: '1960 a starší' },
  };
};

/**
 * Načte data z Google Sheets
 */
const fetchFromGoogleSheets = async (category) => {
  const url = PRICING_SHEET_URLS[category];

  if (!url) {
    throw new Error(`URL pro kategorii "${category}" není definována`);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'text/csv',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const csvText = await response.text();

  if (!csvText || csvText.trim() === '') {
    throw new Error('Prázdná odpověď z Google Sheets');
  }

  // Pro věkové kategorie použijeme speciální parser
  if (category === 'info_vek') {
    return parseAgeCategoriesCSV(csvText);
  }

  // Pro ostatní použijeme standardní parser
  return parseCSVToPriceRows(csvText);
};

/**
 * Získá data z cache nebo načte z Google Sheets
 */
const getCachedPricing = async (category) => {
  const now = Date.now();
  const cacheKey = `pricing_${category}`;
  const cached = cache.get(cacheKey);

  // Pokud máme platnou cache, vraťme ji
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`✓ Cache HIT pro "${category}" (stáří: ${Math.round((now - cached.timestamp) / 1000)}s)`);
    return {
      data: cached.data,
      cached: true,
      cachedAt: new Date(cached.timestamp).toISOString(),
      expiresIn: Math.round((CACHE_TTL - (now - cached.timestamp)) / 1000),
    };
  }

  // Cache miss - načteme z Google Sheets
  console.log(`✗ Cache MISS pro "${category}" - načítám z Google Sheets...`);

  try {
    const data = await fetchFromGoogleSheets(category);

    // Uložíme do cache
    cache.set(cacheKey, {
      data,
      timestamp: now,
    });

    // Ulož do souboru okamžitě (async, neblokuje odpověď)
    saveCacheToDisk().catch(err => console.error('Chyba při ukládání cache:', err));

    console.log(`✓ Data pro "${category}" načtena a uložena do cache (${Array.isArray(data) ? data.length : 'object'} položek)`);

    return {
      data,
      cached: false,
      cachedAt: new Date(now).toISOString(),
      expiresIn: Math.round(CACHE_TTL / 1000),
    };
  } catch (error) {
    console.error(`Chyba při načítání ceníku "${category}":`, error);

    // Pokud selže načítání, zkusíme použít starou cache (i když expirovanou)
    if (cached) {
      console.log(`⚠ Používám expirovanou cache pro "${category}"`);
      return {
        data: cached.data,
        cached: true,
        expired: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
        error: error.message,
      };
    }

    throw error;
  }
};

/**
 * Vymaže cache pro danou kategorii nebo celou cache
 */
const clearCache = async (category = null) => {
  if (category) {
    const cacheKey = `pricing_${category}`;
    cache.delete(cacheKey);
    console.log(`✓ Cache vymazána pro "${category}"`);
  } else {
    cache.clear();
    console.log(`✓ Celá cache vymazána`);
  }

  // Ulož změny do souboru
  await saveCacheToDisk();
};

/**
 * Vrátí stav cache pro všechny kategorie
 */
const getCacheStatus = () => {
  const now = Date.now();
  const status = {};

  for (const category of Object.keys(PRICING_SHEET_URLS)) {
    const cacheKey = `pricing_${category}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      const age = Math.round((now - cached.timestamp) / 1000);
      const expiresIn = Math.round((CACHE_TTL - (now - cached.timestamp)) / 1000);
      const isExpired = expiresIn <= 0;

      status[category] = {
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
        ageSeconds: age,
        expiresInSeconds: Math.max(0, expiresIn),
        expired: isExpired,
      };
    } else {
      status[category] = {
        cached: false,
      };
    }
  }

  return status;
};

/**
 * Main handler
 */
export default async function handler(req, res) {
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const category = url.searchParams.get('category');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (CORS preflight)
  if (method === 'OPTIONS') {
    return res.status(200).send('');
  }

  // GET - načíst ceník nebo status cache
  if (method === 'GET') {
    // Speciální endpoint pro status cache
    if (category === 'status') {
      return res.status(200).json({
        cacheTTL: CACHE_TTL,
        cacheTTLHours: CACHE_TTL / (60 * 60 * 1000),
        categories: getCacheStatus(),
      });
    }

    if (!category) {
      return res.status(400).json({
        error: 'Missing category parameter',
        validCategories: Object.keys(PRICING_SHEET_URLS),
        hint: 'Use ?category=status to get cache status',
      });
    }

    if (!PRICING_SHEET_URLS[category]) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories: Object.keys(PRICING_SHEET_URLS),
      });
    }

    try {
      const result = await getCachedPricing(category);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching pricing:', error);
      return res.status(500).json({
        error: 'Failed to fetch pricing data',
        message: error.message,
      });
    }
  }

  // DELETE - vymazat cache
  if (method === 'DELETE') {
    try {
      await clearCache(category);
      return res.status(200).json({
        success: true,
        message: category
          ? `Cache vymazána pro kategorii "${category}"`
          : 'Celá cache vymazána',
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to clear cache',
        message: error.message,
      });
    }
  }

  // POST - refresh cache
  if (method === 'POST') {
    if (!category) {
      return res.status(400).json({
        error: 'Missing category parameter for refresh',
      });
    }

    if (!PRICING_SHEET_URLS[category]) {
      return res.status(400).json({
        error: 'Invalid category',
        validCategories: Object.keys(PRICING_SHEET_URLS),
      });
    }

    try {
      // Vymažeme starou cache
      await clearCache(category);
      // Načteme novou
      const result = await getCachedPricing(category);
      return res.status(200).json({
        success: true,
        message: `Cache obnovena pro kategorii "${category}"`,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to refresh cache',
        message: error.message,
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
