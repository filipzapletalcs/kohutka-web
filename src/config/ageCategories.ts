/**
 * Globální konfigurace věkových kategorií pro ceník
 *
 * Tato konfigurace se používá napříč celou aplikací (Pricing, Info stránky, atd.)
 * V budoucnu bude načítána z Google Sheets pro snadnou editaci klientem.
 */

export interface AgeCategory {
  label: string;
  birthYears: string;
  description: string;
}

export interface AgeCategoriesConfig {
  adult: AgeCategory;
  child: AgeCategory;
  junior: AgeCategory;
  senior: AgeCategory;
}

/**
 * Výchozí věkové kategorie (fallback pokud Google Sheets není dostupný)
 */
export const DEFAULT_AGE_CATEGORIES: AgeCategoriesConfig = {
  adult: {
    label: "Dospělí",
    birthYears: "1961-2007",
    description: "Narození 1961-2007",
  },
  child: {
    label: "Děti",
    birthYears: "2015 a mladší",
    description: "Narození 2015 a mladší",
  },
  junior: {
    label: "Junioři",
    birthYears: "2006-2014",
    description: "Narození 2006-2014",
  },
  senior: {
    label: "Senioři",
    birthYears: "1960 a starší",
    description: "Narození 1960 a starší",
  },
};

/**
 * Pomocná funkce pro získání věkové kategorie
 */
export const getAgeCategory = (
  category: keyof AgeCategoriesConfig,
  config: AgeCategoriesConfig = DEFAULT_AGE_CATEGORIES
): AgeCategory => {
  return config[category];
};

/**
 * Pomocná funkce pro získání labelu věkové kategorie
 */
export const getAgeCategoryLabel = (
  category: keyof AgeCategoriesConfig,
  config: AgeCategoriesConfig = DEFAULT_AGE_CATEGORIES
): string => {
  return config[category].label;
};

/**
 * Pomocná funkce pro získání rozsahu let narození
 */
export const getAgeCategoryBirthYears = (
  category: keyof AgeCategoriesConfig,
  config: AgeCategoriesConfig = DEFAULT_AGE_CATEGORIES
): string => {
  return config[category].birthYears;
};
