/**
 * Testovací endpoint pro AI Caption Generator
 *
 * Simuluje 15 různých scénářů HolidayInfo dat a generuje captiony pro každý.
 * Výsledky se ukládají do reportu pro analýzu kvality AI generátoru.
 *
 * GET /api/test-caption-scenarios
 * Query params:
 *   - scenario: číslo scénáře (1-15) pro spuštění jednoho
 *   - all: spustit všechny scénáře
 *
 * Provozní doby:
 *   - Běžné lyžování: 08:30-16:30
 *   - Večerní lyžování: 08:30-18:00
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtnchzadjrmgfvhfzpzh.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bmNoemFkanJtZ2Z2aGZ6cHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYyNDAsImV4cCI6MjA4MDQ1MjI0MH0.gaCkl1hs_RKpbtHbSOMGbkAa4dCPgh6erEq524lSDk0';

// Czech day names for display
const DAY_NAMES = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];

/**
 * Generuje náhodné datum v lyžařské sezóně (prosinec - březen)
 * @returns {{ date: string, dayName: string, day: number, month: string }}
 */
function generateRandomSkiSeasonDate() {
  // Lyžařská sezóna: 1.12 - 31.3
  const year = 2025;
  const seasonStart = new Date(year, 11, 1); // 1. prosince
  const seasonEnd = new Date(year + 1, 2, 31); // 31. března

  const totalDays = Math.floor((seasonEnd - seasonStart) / (1000 * 60 * 60 * 24));
  const randomDays = Math.floor(Math.random() * totalDays);

  const randomDate = new Date(seasonStart);
  randomDate.setDate(randomDate.getDate() + randomDays);

  const monthNames = ['ledna', 'února', 'března', 'dubna', 'května', 'června',
                      'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];

  return {
    date: randomDate.toISOString().slice(0, 10), // "2025-01-15"
    dayName: DAY_NAMES[randomDate.getDay()],
    day: randomDate.getDate(),
    month: monthNames[randomDate.getMonth()],
  };
}

// Weather codes mapping
const WEATHER_CODES = {
  1: { emoji: '☀️', text: 'jasno' },
  2: { emoji: '🌤️', text: 'polojasno' },
  3: { emoji: '⛅', text: 'oblačno s projasnění' },
  4: { emoji: '☁️', text: 'oblačno' },
  5: { emoji: '🌧️', text: 'déšť' },
  6: { emoji: '🌨️', text: 'sněžení' },
  7: { emoji: '🌫️', text: 'mlha' },
  8: { emoji: '⛈️', text: 'bouřka' },
};

// Reálná struktura sjezdovek z XML
const SLOPES_FULL = [
  { id: '1', name: 'Velká A', diff_code: 3, diff_text: 'těžká', exceed: 210, length: 850, snowmaking: true },
  { id: '2', name: 'Velká B', diff_code: 2, diff_text: 'střední', exceed: 110, length: 400, snowmaking: true },
  { id: '3', name: 'Babská', diff_code: 1, diff_text: 'lehká', exceed: 210, length: 1200, snowmaking: true },
  { id: '4', name: 'Malá', diff_code: 1, diff_text: 'lehká', exceed: 45, length: 300, snowmaking: true },
  { id: '5', name: 'Dětský skipark', diff_code: 1, diff_text: 'lehká', exceed: 15, length: 100, snowmaking: true },
  { id: '6', name: 'Barborka', diff_code: 1, diff_text: 'lehká', exceed: 30, length: 240, snowmaking: true },
  { id: '7', name: 'Runda', diff_code: 2, diff_text: 'střední', exceed: 210, length: 1300, snowmaking: false },
  { id: '8', name: 'Spartak', diff_code: 1, diff_text: 'lehká', exceed: 40, length: 290, snowmaking: true },
  { id: '9', name: 'Seník', diff_code: 2, diff_text: 'střední', exceed: 70, length: 320, snowmaking: false },
  { id: '10', name: 'Vranča parkoviště', diff_code: 2, diff_text: 'střední', exceed: 310, length: 1600, snowmaking: false },
];

// Reálná struktura vleků z XML
const LIFTS_FULL = [
  { id: 'A', name: 'Velká Kohútka', type_code: 4, type_text: 'čtyřsedačka', length: 730, capacity: 2400 },
  { id: 'B', name: 'Runda', type_code: 5, type_text: 'vlek', length: 300, capacity: 800 },
  { id: 'C', name: 'Malá Kohútka', type_code: 5, type_text: 'vlek', length: 260, capacity: 800 },
  { id: 'D', name: 'Barborka', type_code: 5, type_text: 'vlek', length: 200, capacity: 740 },
  { id: 'E', name: 'Seník', type_code: 5, type_text: 'vlek', length: 290, capacity: 600 },
  { id: 'F', name: 'Spartak', type_code: 5, type_text: 'vlek', length: 270, capacity: 900 },
  { id: 'G', name: 'Dětský skipark', type_code: 7, type_text: 'sunkid', length: 80, capacity: 260 },
];

/**
 * Pomocná funkce pro vytvoření pole sjezdovek s daným statusem
 */
function createSlopesDetailed(openIds) {
  return SLOPES_FULL.map(slope => ({
    ...slope,
    status_code: openIds.includes(slope.id) ? 2 : 3,
    status_text: openIds.includes(slope.id) ? 'Otevřena' : 'Zavřena',
  }));
}

/**
 * Pomocná funkce pro vytvoření pole vleků s daným statusem
 */
function createLiftsDetailed(openIds) {
  return LIFTS_FULL.map(lift => ({
    ...lift,
    status_code: openIds.includes(lift.id) ? 1 : 2,
    status_text: openIds.includes(lift.id) ? 'v provozu' : 'mimo provoz',
  }));
}

/**
 * 15 testovacích scénářů
 */
const SCENARIOS = [
  // ═══════════════════════════════════════════════════════════════
  // IDEÁLNÍ PODMÍNKY (1-4)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 1,
    name: 'Powder Day - čerstvý prašan',
    description: 'Ideální podmínky po celonoční sněhové nadílce',
    category: 'ideal',
    holidayInfo: {
      is_open: true,
      temperature: '-5',
      temp_morning: '-8',
      weather: 'sněžení',
      weather_code: 6,
      snow_height: '80 - 100 cm',
      snow_type: 'přírodní',
      new_snow: '25',
      snow_outside_slopes: '40',
      text_comment: 'Celou noc sněžilo! Prašan na všech sjezdovkách. První stopy čekají!',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 8.5,
      rating_count: 400,
      slopes_open_count: 10,
      slopes_total_count: 10,
      lifts_open_count: 7,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 6,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']),
      lifts_detailed: createLiftsDetailed(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
    },
    expectedTopics: ['nový sníh', 'prašan', '25 cm', 'první stopy'],
  },
  {
    id: 2,
    name: 'Slunečný zimní den',
    description: 'Perfektní počasí pro lyžování - jasno, mírný mráz',
    category: 'ideal',
    holidayInfo: {
      is_open: true,
      temperature: '-2',
      temp_morning: '-6',
      weather: 'jasno',
      weather_code: 1,
      snow_height: '60 - 80 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '15',
      text_comment: 'Sluníčko svítí, sníh drží. Co víc si přát?',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 8.2,
      rating_count: 385,
      slopes_open_count: 8,
      slopes_total_count: 10,
      lifts_open_count: 6,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 5,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8', '9']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'E', 'F', 'G']),
    },
    expectedTopics: ['slunce', 'jasno', 'počasí'],
  },
  {
    id: 3,
    name: 'Perfektní technický sníh',
    description: 'Strojově upravené sjezdovky v top kondici',
    category: 'ideal',
    holidayInfo: {
      is_open: true,
      temperature: '-3',
      temp_morning: '-7',
      weather: 'polojasno',
      weather_code: 2,
      snow_height: '90 - 110 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '10',
      text_comment: 'Rolby jely celou noc. Sjezdovky jako ze škatulky!',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 9.2,
      rating_count: 420,
      slopes_open_count: 8,
      slopes_total_count: 10,
      lifts_open_count: 6,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 5,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8', '9']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'E', 'F', 'G']),
    },
    expectedTopics: ['technický', 'rolby', 'upravené', 'hodnocení'],
  },
  {
    id: 4,
    name: 'Rodinný den',
    description: 'Dětský skipark v provozu, speciální akce pro děti',
    category: 'ideal',
    holidayInfo: {
      is_open: true,
      temperature: '-1',
      temp_morning: '-4',
      weather: 'oblačno s projasnění',
      weather_code: 3,
      snow_height: '50 - 70 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '5',
      text_comment: 'Dětské závody od 14:00! Skipark otevřen, sunkid jede. Rodiny vítány!',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 8.0,
      rating_count: 370,
      slopes_open_count: 7,
      slopes_total_count: 10,
      lifts_open_count: 5,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 4,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'F', 'G']),
    },
    expectedTopics: ['děti', 'skipark', 'rodiny', 'závody'],
  },

  // ═══════════════════════════════════════════════════════════════
  // DOBRÉ PODMÍNKY (5-8)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 5,
    name: 'Vtipný text_comment',
    description: 'Provozovatel napsal vtipnou poznámku',
    category: 'good',
    holidayInfo: {
      is_open: true,
      temperature: '0',
      temp_morning: '-3',
      weather: 'oblačno',
      weather_code: 4,
      snow_height: '40 - 60 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '5',
      text_comment: 'K překročení hranice na KOHÚTCE nepotřebujete pas, ale valašský skipas!',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 8.1,
      rating_count: 370,
      slopes_open_count: 7,
      slopes_total_count: 10,
      lifts_open_count: 5,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 4,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'F', 'G']),
    },
    expectedTopics: ['valašský', 'skipas', 'hranice'],
  },
  {
    id: 6,
    name: 'Ranní firn',
    description: 'Tvrdý jarní sníh, ideální pro ranní carving',
    category: 'good',
    holidayInfo: {
      is_open: true,
      temperature: '2',
      temp_morning: '-8',
      weather: 'jasno',
      weather_code: 1,
      snow_height: '30 - 50 cm',
      snow_type: 'firn',
      new_snow: '0',
      snow_outside_slopes: '0',
      text_comment: 'Ráno firn, odpoledne měkčí. Carvingové oblouky zaručeny!',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 7.8,
      rating_count: 350,
      slopes_open_count: 6,
      slopes_total_count: 10,
      lifts_open_count: 5,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 4,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'F', 'G']),
    },
    expectedTopics: ['firn', 'carving', 'ráno', 'teplota'],
  },
  {
    id: 7,
    name: 'Teplotní skok',
    description: 'Velký rozdíl mezi ranní a aktuální teplotou',
    category: 'good',
    holidayInfo: {
      is_open: true,
      temperature: '5',
      temp_morning: '-10',
      weather: 'jasno',
      weather_code: 1,
      snow_height: '40 - 60 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '5',
      text_comment: 'Otepluje se! Ráno -10°C, teď už 5°C. Sníh drží.',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 7.5,
      rating_count: 360,
      slopes_open_count: 7,
      slopes_total_count: 10,
      lifts_open_count: 5,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 4,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'F', 'G']),
    },
    expectedTopics: ['teplota', 'oteplení', 'ráno', '-10'],
  },
  {
    id: 8,
    name: 'Vysoké hodnocení',
    description: 'Areál má skvělé hodnocení od návštěvníků',
    category: 'good',
    holidayInfo: {
      is_open: true,
      temperature: '-2',
      temp_morning: '-5',
      weather: 'polojasno',
      weather_code: 2,
      snow_height: '60 - 80 cm',
      snow_type: 'technický',
      new_snow: '5',
      snow_outside_slopes: '10',
      text_comment: 'Děkujeme za skvělé hodnocení! Snažíme se pro vás.',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 9.5,
      rating_count: 500,
      slopes_open_count: 8,
      slopes_total_count: 10,
      lifts_open_count: 6,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 5,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8', '9']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'E', 'F', 'G']),
    },
    expectedTopics: ['hodnocení', '9.5', '500'],
  },

  // ═══════════════════════════════════════════════════════════════
  // PRŮMĚRNÉ PODMÍNKY (9-11)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 9,
    name: 'Oblačný den',
    description: 'Standardní zimní den bez výrazných vlastností',
    category: 'average',
    holidayInfo: {
      is_open: true,
      temperature: '0',
      temp_morning: '-2',
      weather: 'oblačno',
      weather_code: 4,
      snow_height: '40 - 60 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '5',
      text_comment: '',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 8.0,
      rating_count: 370,
      slopes_open_count: 7,
      slopes_total_count: 10,
      lifts_open_count: 5,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 4,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'F', 'G']),
    },
    expectedTopics: ['sjezdovky', 'vleky', 'sníh'],
  },
  {
    id: 10,
    name: 'Polovina sjezdovek',
    description: 'Pouze 5 z 10 sjezdovek otevřeno',
    category: 'average',
    holidayInfo: {
      is_open: true,
      temperature: '1',
      temp_morning: '-1',
      weather: 'oblačno',
      weather_code: 4,
      snow_height: '30 - 50 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '0',
      text_comment: 'Hlavní sjezdovky otevřeny. Babská a Velká A jedou!',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 7.5,
      rating_count: 340,
      slopes_open_count: 5,
      slopes_total_count: 10,
      lifts_open_count: 4,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 3,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '3', '4', '5', '6']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'G']),
    },
    expectedTopics: ['Babská', 'Velká A', '5/10'],
  },
  {
    id: 11,
    name: 'Bez lanovky',
    description: 'Čtyřsedačka mimo provoz, pouze vleky',
    category: 'average',
    holidayInfo: {
      is_open: true,
      temperature: '-1',
      temp_morning: '-3',
      weather: 'oblačno s projasnění',
      weather_code: 3,
      snow_height: '40 - 60 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '5',
      text_comment: 'Lanovka na pravidelné údržbě. Vleky v plném provozu!',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 7.2,
      rating_count: 350,
      slopes_open_count: 6,
      slopes_total_count: 10,
      lifts_open_count: 4,
      lifts_total_count: 7,
      cable_car_open_count: 0,
      cable_car_total_count: 1,
      drag_lift_open_count: 4,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['2', '3', '4', '5', '6', '8']),
      lifts_detailed: createLiftsDetailed(['C', 'D', 'F', 'G']),
    },
    expectedTopics: ['vleky', 'údržba', 'lanovka'],
  },

  // ═══════════════════════════════════════════════════════════════
  // ŠPATNÉ PODMÍNKY (12-15)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 12,
    name: 'Déšť',
    description: 'Prší, sníh je mokrý',
    category: 'bad',
    holidayInfo: {
      is_open: true,
      temperature: '4',
      temp_morning: '2',
      weather: 'déšť',
      weather_code: 5,
      snow_height: '25 - 40 cm',
      snow_type: 'mokrý',
      new_snow: '0',
      snow_outside_slopes: '0',
      text_comment: 'Bohužel prší, ale jedeme dál. Sníh drží, opatrně v zatáčkách.',
      opertime: '08:30-16:30',
      skipark_open: false,
      rating_avg: 6.5,
      rating_count: 320,
      slopes_open_count: 5,
      slopes_total_count: 10,
      lifts_open_count: 4,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 3,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '6']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'F']),
    },
    expectedTopics: ['déšť', 'mokrý', 'opatrně'],
  },
  {
    id: 13,
    name: 'Mlha',
    description: 'Hustá mlha, omezená viditelnost',
    category: 'bad',
    holidayInfo: {
      is_open: true,
      temperature: '0',
      temp_morning: '-1',
      weather: 'hustá mlha',
      weather_code: 7,
      snow_height: '40 - 60 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '5',
      text_comment: 'Mlha! Viditelnost snížená. Jezděte opatrně a pomalu.',
      opertime: '08:30-16:30',
      skipark_open: true,
      rating_avg: 7.0,
      rating_count: 350,
      slopes_open_count: 7,
      slopes_total_count: 10,
      lifts_open_count: 5,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 4,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '2', '3', '4', '5', '6', '8']),
      lifts_detailed: createLiftsDetailed(['A', 'C', 'D', 'F', 'G']),
    },
    expectedTopics: ['mlha', 'viditelnost', 'opatrně'],
  },
  {
    id: 14,
    name: 'Málo sněhu',
    description: 'Nízká sněhová pokrývka, omezený provoz',
    category: 'bad',
    holidayInfo: {
      is_open: true,
      temperature: '3',
      temp_morning: '0',
      weather: 'polojasno',
      weather_code: 2,
      snow_height: '15 - 25 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '0',
      text_comment: 'Sněhu málo, ale hlavní sjezdovky jedou. Děláme co můžeme!',
      opertime: '08:30-16:30',
      skipark_open: false,
      rating_avg: 6.0,
      rating_count: 300,
      slopes_open_count: 3,
      slopes_total_count: 10,
      lifts_open_count: 2,
      lifts_total_count: 7,
      cable_car_open_count: 1,
      cable_car_total_count: 1,
      drag_lift_open_count: 1,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['1', '3', '4']),
      lifts_detailed: createLiftsDetailed(['A', 'C']),
    },
    expectedTopics: ['málo sněhu', 'omezený', '3/10'],
  },
  {
    id: 15,
    name: 'Silný vítr / bouřka',
    description: 'Lanovka mimo provoz kvůli větru',
    category: 'bad',
    holidayInfo: {
      is_open: true,
      temperature: '-2',
      temp_morning: '-5',
      weather: 'silný vítr',
      weather_code: 8,
      snow_height: '50 - 70 cm',
      snow_type: 'technický',
      new_snow: '0',
      snow_outside_slopes: '10',
      text_comment: 'Lanovka mimo provoz kvůli silnému větru. Vleky jedou!',
      opertime: '08:30-16:30',
      skipark_open: false,
      rating_avg: 7.0,
      rating_count: 340,
      slopes_open_count: 5,
      slopes_total_count: 10,
      lifts_open_count: 3,
      lifts_total_count: 7,
      cable_car_open_count: 0,
      cable_car_total_count: 1,
      drag_lift_open_count: 3,
      drag_lift_total_count: 6,
      slopes_detailed: createSlopesDetailed(['2', '3', '4', '6', '8']),
      lifts_detailed: createLiftsDetailed(['C', 'D', 'F']),
    },
    expectedTopics: ['vítr', 'lanovka', 'vleky'],
  },
];

/**
 * Uloží testovací data do holidayinfo_cache
 */
async function updateTestCache(supabase, holidayInfo) {
  const { error } = await supabase
    .from('holidayinfo_cache')
    .upsert({
      id: 'main',
      ...holidayInfo,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Failed to update cache: ${error.message}`);
  }
}

/**
 * Zavolá generate-caption endpoint
 * @param {string} baseUrl - Base URL serveru
 * @param {string} testDate - ISO datum pro simulaci (např. "2025-01-15")
 */
async function generateCaption(baseUrl, testDate) {
  const response = await fetch(`${baseUrl}/api/generate-caption`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testHour: 8, // Simulace 8:00 ráno - kdy se posílají autoposty
      testDate,    // Náhodné datum v lyžařské sezóně
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Formátuje výstup jednoho scénáře
 */
function formatScenarioResult(scenario, result, duration, dateInfo = null) {
  const categoryLabel = {
    ideal: '🟢 IDEAL',
    good: '🔵 GOOD',
    average: '🟡 AVERAGE',
    bad: '🔴 BAD',
  };

  const hi = scenario.holidayInfo;
  const weatherInfo = WEATHER_CODES[hi.weather_code] || { emoji: '❓', text: hi.weather };
  const dateStr = dateInfo ? `${dateInfo.dayName} ${dateInfo.day}. ${dateInfo.month}` : 'dnes';

  const lines = [
    `┌─────────────────────────────────────────────────────────────────┐`,
    `│ SCÉNÁŘ ${scenario.id}: ${scenario.name.padEnd(40)} [${categoryLabel[scenario.category]}]│`,
    `├─────────────────────────────────────────────────────────────────┤`,
    `│ SIMULOVANÉ DATUM: ${dateStr}`.padEnd(66) + '│',
    `│ VSTUPNÍ DATA:                                                   │`,
    `│   Teplota:    ${hi.temperature}°C (ráno ${hi.temp_morning}°C)`.padEnd(66) + '│',
    `│   Počasí:     ${weatherInfo.emoji} ${hi.weather} (kód ${hi.weather_code})`.padEnd(66) + '│',
    `│   Sníh:       ${hi.snow_height} (${hi.snow_type})`.padEnd(66) + '│',
  ];

  if (hi.new_snow && hi.new_snow !== '0') {
    lines.push(`│   Nový sníh:  ${hi.new_snow} cm`.padEnd(66) + '│');
  }

  if (hi.snow_outside_slopes && hi.snow_outside_slopes !== '0') {
    lines.push(`│   Mimo svahy: ${hi.snow_outside_slopes} cm`.padEnd(66) + '│');
  }

  if (hi.text_comment) {
    const comment = hi.text_comment.length > 50
      ? hi.text_comment.substring(0, 47) + '...'
      : hi.text_comment;
    lines.push(`│   Poznámka:   "${comment}"`.padEnd(66) + '│');
  }

  lines.push(`│   Skipark:    ${hi.skipark_open ? 'OTEVŘEN' : 'ZAVŘEN'}`.padEnd(66) + '│');
  lines.push(`│   Sjezdovky:  ${hi.slopes_open_count}/${hi.slopes_total_count}`.padEnd(66) + '│');
  lines.push(`│   Vleky:      ${hi.lifts_open_count}/${hi.lifts_total_count} (${hi.cable_car_open_count} lanovka, ${hi.drag_lift_open_count} vleků)`.padEnd(66) + '│');
  lines.push(`├─────────────────────────────────────────────────────────────────┤`);
  lines.push(`│ VYGENEROVANÝ CAPTION:                                           │`);

  // Rozdělení caption na řádky po 60 znacích
  const caption = result.success ? result.caption : `ERROR: ${result.error}`;
  const captionLines = [];
  let remaining = caption;
  while (remaining.length > 0) {
    captionLines.push(remaining.substring(0, 60));
    remaining = remaining.substring(60);
  }

  for (const line of captionLines) {
    lines.push(`│   "${line}"`.padEnd(66) + '│');
  }

  lines.push(`├─────────────────────────────────────────────────────────────────┤`);
  lines.push(`│ Délka: ${caption.length} znaků | Čas: ${duration}ms`.padEnd(66) + '│');
  lines.push(`└─────────────────────────────────────────────────────────────────┘`);

  return lines.join('\n');
}

/**
 * Generuje markdown report s kompletními vstupními daty
 */
function generateMarkdownReport(results) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);

  let md = `# AI Caption Generator - Test Report\n\n`;
  md += `**Datum:** ${timestamp}\n`;
  md += `**Simulovaný čas:** 08:00 ráno\n`;
  md += `**Počet scénářů:** ${results.length}\n\n`;
  md += `---\n\n`;

  for (const r of results) {
    const hi = r.scenario.holidayInfo;
    const dateInfo = r.dateInfo;
    const categoryLabel = {
      ideal: '🟢 IDEAL',
      good: '🔵 GOOD',
      average: '🟡 AVERAGE',
      bad: '🔴 BAD',
    };
    const dateStr = dateInfo ? `${dateInfo.dayName} ${dateInfo.day}. ${dateInfo.month}` : 'dnes';

    md += `## ${r.scenario.id}. ${r.scenario.name} [${categoryLabel[r.scenario.category]}]\n\n`;

    md += `### Vstupní data\n\n`;
    md += `| Pole | Hodnota |\n`;
    md += `|------|--------|\n`;
    md += `| Simulované datum | ${dateStr} (08:00 ráno) |\n`;
    md += `| Teplota | ${hi.temperature}°C (ráno ${hi.temp_morning}°C) |\n`;
    md += `| Počasí | ${hi.weather} (kód ${hi.weather_code}) |\n`;
    md += `| Sníh | ${hi.snow_height} (${hi.snow_type}) |\n`;
    md += `| Nový sníh | ${hi.new_snow || '-'} cm |\n`;
    md += `| Mimo svahy | ${hi.snow_outside_slopes || '-'} cm |\n`;
    md += `| Skipark | ${hi.skipark_open ? 'OTEVŘEN' : 'ZAVŘEN'} |\n`;
    md += `| Sjezdovky | ${hi.slopes_open_count}/${hi.slopes_total_count} |\n`;
    md += `| Vleky | ${hi.lifts_open_count}/${hi.lifts_total_count} |\n`;
    md += `| Lanovka | ${hi.cable_car_open_count}/${hi.cable_car_total_count} |\n`;
    md += `| Provozní doba | ${hi.opertime} |\n\n`;

    if (hi.text_comment) {
      md += `**Poznámka provozovatele:**\n> ${hi.text_comment}\n\n`;
    }

    md += `### Vygenerovaný caption\n\n`;
    if (r.result.success) {
      md += `> ${r.result.caption}\n\n`;
      md += `**Délka:** ${r.result.caption?.length || 0} znaků | **Čas:** ${r.duration}ms\n\n`;
    } else {
      md += `> ❌ ERROR: ${r.result.error}\n\n`;
    }
    md += `---\n\n`;
  }

  // Shrnutí na konci
  const successful = results.filter(r => r.result.success);
  const lengths = successful.map(r => r.result.caption.length);
  const avgLength = lengths.length > 0 ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length) : 0;
  const avgTime = Math.round(results.map(r => r.duration).reduce((a, b) => a + b, 0) / results.length);

  md += `## Shrnutí\n\n`;
  md += `| Metrika | Hodnota |\n`;
  md += `|---------|--------|\n`;
  md += `| Úspěšných | ${successful.length}/${results.length} |\n`;
  md += `| Průměrná délka | ${avgLength} znaků |\n`;
  md += `| Průměrný čas | ${avgTime}ms |\n`;

  return md;
}

/**
 * Generuje finální report
 */
function generateReport(results) {
  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);

  const lines = [
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `  KOMPLETNÍ REPORT - AI CAPTION GENERATOR TEST`,
    `  Datum: ${timestamp}`,
    `  Simulovaný čas: 08:00 ráno (kdy se posílají autoposty)`,
    `  Počet scénářů: ${results.length}`,
    `═══════════════════════════════════════════════════════════════════`,
    ``,
  ];

  // Jednotlivé výsledky
  for (const r of results) {
    lines.push(r.formatted);
    lines.push('');
  }

  // Shrnutí
  lines.push(`═══════════════════════════════════════════════════════════════════`);
  lines.push(`  SHRNUTÍ`);
  lines.push(`═══════════════════════════════════════════════════════════════════`);
  lines.push(``);

  // Statistiky podle kategorie
  const byCategory = {
    ideal: results.filter(r => r.scenario.category === 'ideal'),
    good: results.filter(r => r.scenario.category === 'good'),
    average: results.filter(r => r.scenario.category === 'average'),
    bad: results.filter(r => r.scenario.category === 'bad'),
  };

  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);

  lines.push(`VÝSLEDKY PO KATEGORIÍCH:`);
  lines.push(`┌────────────────────────┬───────────┬───────────┐`);
  lines.push(`│ Kategorie              │ Úspěšných │ Celkem    │`);
  lines.push(`├────────────────────────┼───────────┼───────────┤`);

  for (const [cat, items] of Object.entries(byCategory)) {
    const success = items.filter(i => i.result.success).length;
    const label = cat.toUpperCase().padEnd(20);
    lines.push(`│ ${label}   │ ${String(success).padStart(5)}     │ ${String(items.length).padStart(5)}     │`);
  }

  lines.push(`├────────────────────────┼───────────┼───────────┤`);
  lines.push(`│ CELKEM                 │ ${String(successful.length).padStart(5)}     │ ${String(results.length).padStart(5)}     │`);
  lines.push(`└────────────────────────┴───────────┴───────────┘`);
  lines.push(``);

  // Statistiky délky captionů
  const lengths = successful.map(r => r.result.caption.length);
  if (lengths.length > 0) {
    const avgLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    const minLength = Math.min(...lengths);
    const maxLength = Math.max(...lengths);

    lines.push(`DÉLKA CAPTIONŮ:`);
    lines.push(`  Průměr: ${avgLength} znaků`);
    lines.push(`  Min: ${minLength} znaků`);
    lines.push(`  Max: ${maxLength} znaků`);
    lines.push(``);
  }

  // Statistiky času
  const times = results.map(r => r.duration);
  const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  lines.push(`ČAS GENEROVÁNÍ:`);
  lines.push(`  Průměr: ${avgTime}ms`);
  lines.push(`  Celkem: ${times.reduce((a, b) => a + b, 0)}ms`);
  lines.push(``);

  if (failed.length > 0) {
    lines.push(`CHYBY (${failed.length}):`);
    for (const f of failed) {
      lines.push(`  - Scénář ${f.scenario.id}: ${f.result.error}`);
    }
    lines.push(``);
  }

  lines.push(`═══════════════════════════════════════════════════════════════════`);

  return lines.join('\n');
}

/**
 * Hlavní handler
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { scenario: scenarioId, all, truncate } = req.query;

  // Určit base URL pro volání generate-caption
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Volitelně vymazat historii captionů
    if (truncate === 'true') {
      console.log('[Test] Truncating generated_captions table...');
      const { error } = await supabase.from('generated_captions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) {
        console.error('[Test] Truncate error:', error);
      }
    }

    // Zálohovat původní data
    console.log('[Test] Backing up original cache...');
    const { data: originalCache, error: backupError } = await supabase
      .from('holidayinfo_cache')
      .select('*')
      .eq('id', 'main')
      .single();

    if (backupError) {
      return res.status(500).json({ error: 'Failed to backup original cache', details: backupError.message });
    }

    // Vybrat scénáře k testování
    let scenariosToRun = SCENARIOS;
    if (scenarioId) {
      const id = parseInt(scenarioId);
      scenariosToRun = SCENARIOS.filter(s => s.id === id);
      if (scenariosToRun.length === 0) {
        return res.status(400).json({ error: `Scenario ${id} not found. Valid: 1-15` });
      }
    }

    console.log(`[Test] Running ${scenariosToRun.length} scenario(s)...`);

    const results = [];

    for (const scenario of scenariosToRun) {
      // Vygenerovat náhodné datum v lyžařské sezóně
      const dateInfo = generateRandomSkiSeasonDate();
      console.log(`[Test] Scenario ${scenario.id}: ${scenario.name} (${dateInfo.dayName} ${dateInfo.day}. ${dateInfo.month})`);

      // Aktualizovat cache testovacími daty
      await updateTestCache(supabase, scenario.holidayInfo);

      // Počkat krátce, aby se cache propsal
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generovat caption s náhodným datem
      const start = Date.now();
      let result;
      try {
        result = await generateCaption(baseUrl, dateInfo.date);
      } catch (e) {
        result = { success: false, error: e.message };
      }
      const duration = Date.now() - start;

      // Formátovat výsledek
      const formatted = formatScenarioResult(scenario, result, duration, dateInfo);
      console.log(formatted);

      results.push({
        scenario,
        result,
        duration,
        formatted,
        dateInfo,
      });

      // Pauza mezi scénáři (rate limiting + čitelnost)
      if (scenariosToRun.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Obnovit původní data
    console.log('[Test] Restoring original cache...');
    if (originalCache) {
      await updateTestCache(supabase, originalCache);
    }

    // Generovat reporty
    const report = generateReport(results);
    const markdownReport = generateMarkdownReport(results);
    const reportFilename = `test-report-${new Date().toISOString().slice(0, 10)}.md`;
    console.log(report);

    // Vrátit výsledky
    return res.status(200).json({
      success: true,
      scenariosRun: results.length,
      results: results.map(r => ({
        id: r.scenario.id,
        name: r.scenario.name,
        category: r.scenario.category,
        simulatedDate: r.dateInfo ? `${r.dateInfo.dayName} ${r.dateInfo.day}. ${r.dateInfo.month}` : null,
        success: r.result.success,
        caption: r.result.caption,
        rawCaption: r.result.rawCaption,
        error: r.result.error,
        duration: r.duration,
      })),
      report,
      markdownReport,
      markdownFilename: reportFilename,
    });

  } catch (error) {
    console.error('[Test] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
