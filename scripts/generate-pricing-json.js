/**
 * Generuje statický pricing.json soubor pro okamžité načtení na frontendu
 *
 * Spouští se:
 * - Při buildu: npm run build (před vite build)
 * - Manuálně: node scripts/generate-pricing-json.js
 * - Cron job na VPS pro periodické aktualizace
 *
 * Priorita zdrojů:
 * 1. Existující cache (.cache/pricing-cache.json)
 * 2. Google Sheets (fallback)
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Load .env manually
const loadEnv = async () => {
  const envPath = join(ROOT_DIR, '.env');
  if (existsSync(envPath)) {
    const envContent = await readFile(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  }
};

await loadEnv();

const CACHE_FILE = join(ROOT_DIR, '.cache', 'pricing-cache.json');
const OUTPUT_FILE = join(ROOT_DIR, 'public', 'data', 'pricing.json');

// Google Sheets URLs
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
  const hasLetters = /[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(value);
  if (hasLetters) return value;
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) return numValue;
  return value;
};

/**
 * Parsuje CSV na PriceRow[]
 */
const parseCSVToPriceRows = (csvText) => {
  const lines = csvText.trim().split('\n');
  const dataLines = lines.slice(1);
  const rows = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = parseCSVLine(line);

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
 * Parsuje věkové kategorie
 */
const parseAgeCategoriesCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const dataLines = lines.slice(1);
  const categories = {};

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const values = parseCSVLine(line);
    const category = values[0]?.trim().toLowerCase();
    const name = values[1]?.trim();
    const birthYears = values[2]?.trim();

    if (category && name && birthYears) {
      categories[category] = { category, name, birthYears };
    }
  }

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
  if (!url) throw new Error(`URL pro "${category}" není definována`);

  const response = await fetch(url, {
    headers: { 'Accept': 'text/csv' },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const csvText = await response.text();
  if (!csvText || csvText.trim() === '') throw new Error('Prázdná odpověď');

  if (category === 'info_vek') {
    return parseAgeCategoriesCSV(csvText);
  }
  return parseCSVToPriceRows(csvText);
};

/**
 * Načte všechna data z cache nebo Google Sheets
 */
const loadAllPricingData = async () => {
  // Zkus načíst z existující cache
  if (existsSync(CACHE_FILE)) {
    console.log('📂 Načítám z existující cache...');
    try {
      const cacheData = JSON.parse(await readFile(CACHE_FILE, 'utf-8'));

      // Extrahuj data z cache formátu
      const result = {};
      for (const [key, value] of Object.entries(cacheData)) {
        const category = key.replace('pricing_', '');
        result[category] = value.data;
      }

      console.log(`✅ Cache načtena (${Object.keys(result).length} kategorií)`);
      return result;
    } catch (error) {
      console.warn('⚠️ Cache nelze načíst:', error.message);
    }
  }

  // Fallback: načti z Google Sheets
  console.log('🌐 Načítám z Google Sheets...');
  const result = {};

  for (const category of Object.keys(PRICING_SHEET_URLS)) {
    if (!PRICING_SHEET_URLS[category]) continue;

    try {
      console.log(`  → ${category}...`);
      result[category] = await fetchFromGoogleSheets(category);
    } catch (error) {
      console.error(`  ✗ ${category}: ${error.message}`);
    }
  }

  return result;
};

/**
 * Main
 */
const main = async () => {
  console.log('\n🔧 Generuji statický pricing.json...\n');

  try {
    // Načti data
    const pricingData = await loadAllPricingData();

    // Vytvoř výstupní strukturu
    const output = {
      generatedAt: new Date().toISOString(),
      categories: pricingData,
    };

    // Zajisti existenci output složky
    const outputDir = dirname(OUTPUT_FILE);
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Ulož
    await writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

    console.log(`\n✅ Hotovo! Uloženo do: ${OUTPUT_FILE}`);
    console.log(`📊 Kategorií: ${Object.keys(pricingData).length}`);
    console.log(`📅 Vygenerováno: ${output.generatedAt}\n`);

  } catch (error) {
    console.error('\n❌ Chyba:', error.message);
    process.exit(1);
  }
};

main();
