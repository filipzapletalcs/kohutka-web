import type { DefaultTemplate } from './types';

// Helper funkce pro emoji počasí (používá se v preview)
export function getWeatherEmoji(weatherCode: number): string {
  switch (weatherCode) {
    case 1: return '☀️';
    case 2: return '🌤️';
    case 3: return '⛅';
    case 4: return '☁️';
    case 5: return '🌧️';
    case 6: return '🌨️';
    case 7: return '🌫️';
    case 8: return '⛈️';
    default: return '🌤️';
  }
}

// Výchozí šablony - použijí se pro seed do databáze
// Obsahují placeholdery, které se nahradí skutečnými hodnotami při zobrazení náhledu
export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: 'Denní report',
    description: 'Poznámka + kamera + odkaz',
    emoji: '📢',
    content: '📢 {text_comment}\n\n📸 Pohled z kamery: {kamera}\n\nVíce info 👉 kohutka.ski',
    sort_order: 1,
  },
  {
    name: 'S počasím',
    description: 'Počasí + poznámka + nový sníh',
    emoji: '🌤️',
    content: '{pocasi} na Kohútce\n\n📢 {text_comment}\n\n❄️ Nový sníh: {novy_snih}\n\n📸 {kamera}',
    sort_order: 2,
  },
  {
    name: 'Ranní pozvánka',
    description: 'Přívětivý ranní pozdrav',
    emoji: '☀️',
    content: '☀️ Dobré ráno z Kohútky!\n\n{text_comment}\n\nPřijeďte si zalyžovat! 🎿\n\n📸 {kamera}',
    sort_order: 3,
  },
  {
    name: 'Stručná',
    description: 'Jen poznámka a kamera',
    emoji: '📝',
    content: '{text_comment}\n\n📸 {kamera} | kohutka.ski',
    sort_order: 4,
  },
];

// Funkce pro odstranění řádků s kamerou (při widget_only nebo none)
export function stripCameraReferences(text: string): string {
  return text
    .split('\n')
    .filter(line => !line.includes('{kamera}') && !line.includes('📸'))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')  // Vyčistit extra prázdné řádky
    .trim();
}
