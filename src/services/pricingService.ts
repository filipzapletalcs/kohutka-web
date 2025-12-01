/**
 * Service pro načítání ceníku
 *
 * Cache strategie (priorita):
 * 1. In-memory cache (okamžité)
 * 2. Statický JSON soubor /data/pricing.json (velmi rychlé)
 * 3. localStorage cache (rychlé)
 * 4. Server API cache (pomalejší)
 * 5. Přímé volání Google Sheets (fallback)
 */

import { getCacheItem, setCacheItem } from './cacheHelper';

// In-memory cache pro okamžité načtení
let staticPricingData: Record<string, PriceRow[]> | null = null;
let staticAgeCategoriesData: AgeCategoriesData | null = null;
let staticDataLoaded = false;
let staticDataPromise: Promise<void> | null = null;

export interface PriceRow {
  name: string;
  adult?: number | string;
  child?: number | string;
  junior?: number | string;
  senior?: number | string;
  all?: number | string;
  isHeader?: boolean;
  isSubheader?: boolean;
  note?: string;
}

export type PricingCategory =
  | 'denni'
  | 'casove'
  | 'sezonni'
  | 'jednotlive'
  | 'bodove'
  | 'ostatni';

export interface AgeCategory {
  category: string; // 'adult', 'child', 'junior', 'senior'
  name: string; // 'Dospělí', 'Děti', atd.
  birthYears: string; // '1961-2007', atd.
}

export interface AgeCategoriesData {
  adult: AgeCategory;
  child: AgeCategory;
  junior: AgeCategory;
  senior: AgeCategory;
}

/**
 * Mapa URL pro jednotlivé kategorie ceníku z .env
 */
const PRICING_SHEET_URLS: Record<PricingCategory, string> = {
  denni: import.meta.env.VITE_PRICING_DENNI_URL || '',
  casove: import.meta.env.VITE_PRICING_CASOVE_URL || '',
  sezonni: import.meta.env.VITE_PRICING_SEZONNI_URL || '',
  jednotlive: import.meta.env.VITE_PRICING_JEDNOTLIVE_URL || '',
  bodove: import.meta.env.VITE_PRICING_BODOVE_URL || '',
  ostatni: import.meta.env.VITE_PRICING_OSTATNI_URL || '',
};

/**
 * Parsuje CSV řádek s ohledem na quoted values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
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
const parseValue = (value: string): number | string | undefined => {
  if (!value || value === '') return undefined;

  // Pokud hodnota obsahuje písmena (kromě číslic), je to text
  // Např. "10 bodů", "4 body", "—"
  const hasLetters = /[a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/.test(value);

  if (hasLetters) {
    return value; // Vrátíme jako string (např. "10 bodů", "—")
  }

  // Pokud je to čisté číslo, vrátíme number
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) return numValue;

  // Jinak vrátíme string
  return value;
};

/**
 * Parsuje CSV text na PriceRow[]
 */
export const parseCSVToPriceRows = (csvText: string): PriceRow[] => {
  const lines = csvText.trim().split('\n');

  // Přeskočíme header řádek (první řádek)
  const dataLines = lines.slice(1);

  const rows: PriceRow[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue; // Přeskočíme prázdné řádky

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

    const row: PriceRow = {
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
 * Načte ceník z lokálního API s cache (primární metoda)
 *
 * @param category - Kategorie ceníku (denni, casove, atd.)
 * @returns Promise<PriceRow[]>
 * @throws Error pokud se nepodaří načíst data
 */
const fetchPricingFromAPI = async (
  category: PricingCategory
): Promise<PriceRow[]> => {
  try {
    // Zkus načíst z lokálního API (s cache na serveru)
    const apiUrl = `/api/pricing?category=${category}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const result = await response.json();

    if (!result.data) {
      throw new Error('API nevrátilo data');
    }

    // Log pro debugging
    if (result.cached) {
      console.log(`✓ Ceník "${category}" načten z cache (stáří: ${Math.round((Date.now() - new Date(result.cachedAt).getTime()) / 1000)}s)`);
    } else {
      console.log(`✓ Ceník "${category}" načten z Google Sheets přes API`);
    }

    return result.data;
  } catch (error) {
    console.error(`Chyba při načítání ceníku "${category}" z API:`, error);
    throw error;
  }
};

/**
 * Načte a parsuje ceník přímo z Google Sheets (fallback metoda)
 *
 * @param category - Kategorie ceníku (denni, casove, atd.)
 * @returns Promise<PriceRow[]>
 * @throws Error pokud se nepodaří načíst data
 */
const fetchPricingDirectFromGoogleSheets = async (
  category: PricingCategory
): Promise<PriceRow[]> => {
  const url = PRICING_SHEET_URLS[category];

  if (!url) {
    throw new Error(`URL pro kategorii "${category}" není definována v .env`);
  }

  try {
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

    return parseCSVToPriceRows(csvText);
  } catch (error) {
    console.error(`Chyba při načítání ceníku "${category}" z Google Sheets:`, error);
    throw error;
  }
};

/**
 * Načte statický pricing.json (vygenerovaný při buildu)
 * Toto je nejrychlejší způsob načtení - statický soubor
 */
const loadStaticPricingData = async (): Promise<void> => {
  if (staticDataLoaded) return;

  // Zajisti že se načítá jen jednou
  if (staticDataPromise) {
    await staticDataPromise;
    return;
  }

  staticDataPromise = (async () => {
    try {
      const response = await fetch('/data/pricing.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Uložíme do in-memory cache
      staticPricingData = data.categories || {};
      staticAgeCategoriesData = data.categories?.info_vek || null;
      staticDataLoaded = true;

      console.log('✅ Statický pricing.json načten');
    } catch (error) {
      console.warn('⚠️ Statický pricing.json nenalezen, používám API fallback');
      staticDataLoaded = true; // Označíme jako načteno, aby se neopakoval pokus
    }
  })();

  await staticDataPromise;
};

/**
 * Získá data z in-memory cache (okamžité)
 */
export const getStaticPricingData = (category: PricingCategory): PriceRow[] | null => {
  if (staticPricingData && staticPricingData[category]) {
    return staticPricingData[category];
  }
  return null;
};

/**
 * Získá věkové kategorie z in-memory cache (okamžité)
 */
export const getStaticAgeCategories = (): AgeCategoriesData | null => {
  return staticAgeCategoriesData;
};

/**
 * Inicializuje statická data - volat při startu aplikace
 */
export const initStaticPricing = async (): Promise<void> => {
  await loadStaticPricingData();
};

/**
 * Načte a parsuje ceník
 * Cache strategie: In-memory → localStorage → Server API → Google Sheets
 *
 * @param category - Kategorie ceníku (denni, casove, atd.)
 * @returns Promise<PriceRow[]>
 * @throws Error pokud se nepodaří načíst data
 */
export const fetchPricingFromGoogleSheets = async (
  category: PricingCategory
): Promise<PriceRow[]> => {
  // 1. Zkus in-memory static data (okamžité)
  await loadStaticPricingData();
  if (staticPricingData && staticPricingData[category]) {
    return staticPricingData[category];
  }

  // 2. Zkus localStorage cache
  const cachedData = getCacheItem<PriceRow[]>(`pricing_${category}`);
  if (cachedData) {
    return cachedData;
  }

  try {
    // 3. Zkus načíst z API (s cache na serveru)
    const data = await fetchPricingFromAPI(category);
    setCacheItem(`pricing_${category}`, data);
    return data;
  } catch (apiError) {
    console.warn(`API selhalo pro "${category}", zkouším Google Sheets...`);

    try {
      // 4. Fallback na přímé volání Google Sheets
      const data = await fetchPricingDirectFromGoogleSheets(category);
      setCacheItem(`pricing_${category}`, data);
      return data;
    } catch (sheetsError) {
      console.error(`Všechny metody načítání selhaly pro "${category}"`);
      throw sheetsError;
    }
  }
};

/**
 * Kontrola dostupnosti Google Sheets URL
 */
export const checkGoogleSheetsAvailability = async (): Promise<boolean> => {
  try {
    const testUrl = PRICING_SHEET_URLS.denni;
    if (!testUrl) return false;

    const response = await fetch(testUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Parsuje CSV věkových kategorií na AgeCategoriesData
 *
 * Očekávaná struktura CSV:
 * Kategorie,Název,Narození
 * adult,Dospělí,1961-2007
 * child,Děti,2015 a mladší
 * junior,Junioři,2006-2014
 * senior,Senioři,1960 a starší
 */
const parseAgeCategoriesCSV = (csvText: string): AgeCategoriesData => {
  const lines = csvText.trim().split('\n');
  const dataLines = lines.slice(1); // Přeskočíme header

  const categories: Partial<AgeCategoriesData> = {};

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const values = parseCSVLine(line);

    // Struktura: Kategorie, Název, Narození
    const category = values[0]?.trim().toLowerCase(); // 'adult', 'child', atd.
    const name = values[1]?.trim(); // 'Dospělí', atd.
    const birthYears = values[2]?.trim(); // '1961-2007', atd.

    if (category && name && birthYears) {
      categories[category as keyof AgeCategoriesData] = {
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
 * Načte věkové kategorie z lokálního API s cache (primární metoda)
 *
 * @returns Promise<AgeCategoriesData>
 * @throws Error pokud se nepodaří načíst data
 */
const fetchAgeCategoriesFromAPI = async (): Promise<AgeCategoriesData> => {
  try {
    const apiUrl = '/api/pricing?category=info_vek';
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const result = await response.json();

    if (!result.data) {
      throw new Error('API nevrátilo data');
    }

    // Log pro debugging
    if (result.cached) {
      console.log(`✓ Věkové kategorie načteny z cache (stáří: ${Math.round((Date.now() - new Date(result.cachedAt).getTime()) / 1000)}s)`);
    } else {
      console.log(`✓ Věkové kategorie načteny z Google Sheets přes API`);
    }

    return result.data;
  } catch (error) {
    console.error('Chyba při načítání věkových kategorií z API:', error);
    throw error;
  }
};

/**
 * Načte a parsuje věkové kategorie přímo z Google Sheets (fallback metoda)
 *
 * @returns Promise<AgeCategoriesData>
 * @throws Error pokud se nepodaří načíst data
 */
const fetchAgeCategoriesDirectFromGoogleSheets = async (): Promise<AgeCategoriesData> => {
  const url = import.meta.env.VITE_PRICING_INFO_VEK_URL;

  if (!url) {
    throw new Error('URL pro věkové kategorie není definována v .env');
  }

  try {
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

    return parseAgeCategoriesCSV(csvText);
  } catch (error) {
    console.error('Chyba při načítání věkových kategorií z Google Sheets:', error);
    throw error;
  }
};

/**
 * Načte a parsuje věkové kategorie
 * Cache strategie: In-memory → localStorage → Server API → Google Sheets
 *
 * @returns Promise<AgeCategoriesData>
 * @throws Error pokud se nepodaří načíst data
 */
export const fetchAgeCategoriesFromGoogleSheets = async (): Promise<AgeCategoriesData> => {
  // 1. Zkus in-memory static data (okamžité)
  await loadStaticPricingData();
  if (staticAgeCategoriesData) {
    return staticAgeCategoriesData;
  }

  // 2. Zkus localStorage cache
  const cachedData = getCacheItem<AgeCategoriesData>('age_categories');
  if (cachedData) {
    return cachedData;
  }

  try {
    // 3. Zkus načíst z API
    const data = await fetchAgeCategoriesFromAPI();
    setCacheItem('age_categories', data);
    return data;
  } catch (apiError) {
    console.warn('API selhalo pro věkové kategorie, zkouším Google Sheets...');

    try {
      // 4. Fallback na přímé volání Google Sheets
      const data = await fetchAgeCategoriesDirectFromGoogleSheets();
      setCacheItem('age_categories', data);
      return data;
    } catch (sheetsError) {
      console.error('Všechny metody načítání věkových kategorií selhaly');
      throw sheetsError;
    }
  }
};
