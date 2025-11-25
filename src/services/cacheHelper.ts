/**
 * Helper pro localStorage cache
 * Ukládá data do localStorage s TTL
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_PREFIX = 'pricing_cache_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hodina

/**
 * Uloží data do localStorage cache
 */
export const setCacheItem = <T>(key: string, data: T): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(entry));
    console.log(`✓ Data uložena do localStorage cache: ${key}`);
  } catch (error) {
    console.error('Chyba při ukládání do localStorage:', error);
  }
};

/**
 * Načte data z localStorage cache
 * Vrací null pokud cache neexistuje nebo expirovala
 */
export const getCacheItem = <T>(key: string): T | null => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const item = localStorage.getItem(cacheKey);

    if (!item) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();
    const age = now - entry.timestamp;

    // Pokud expirovala, smažeme ji
    if (age > CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      console.log(`✗ Cache expirovala pro: ${key} (stáří: ${Math.round(age / 1000)}s)`);
      return null;
    }

    console.log(`✓ Cache načtena z localStorage: ${key} (stáří: ${Math.round(age / 1000)}s)`);
    return entry.data;
  } catch (error) {
    console.error('Chyba při načítání z localStorage:', error);
    return null;
  }
};

/**
 * Vymaže konkrétní položku z cache
 */
export const removeCacheItem = (key: string): void => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    localStorage.removeItem(cacheKey);
    console.log(`✓ Cache vymazána: ${key}`);
  } catch (error) {
    console.error('Chyba při mazání z localStorage:', error);
  }
};

/**
 * Vymaže celou cache
 */
export const clearAllCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

    for (const key of cacheKeys) {
      localStorage.removeItem(key);
    }

    console.log(`✓ Celá cache vymazána (${cacheKeys.length} položek)`);
  } catch (error) {
    console.error('Chyba při mazání cache:', error);
  }
};
