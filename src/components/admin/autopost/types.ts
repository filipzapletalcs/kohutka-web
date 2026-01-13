export interface StatusImageData {
  isOpen: boolean;
  isNightSkiing?: boolean;
  temperature: string;
  weather?: string;
  liftsOpen: number;
  liftsTotal: number;
  slopesOpen: number;
  slopesTotal: number;
  snowHeight: string;
  snowType?: string;
  operatingHours?: string;
  date?: string;
}

export interface ManualOverrides {
  enabled: boolean;
  // Základní hodnoty
  temperature: string;
  weather: string;
  liftsOpen: string;
  liftsTotal: string;
  slopesOpen: string;
  slopesTotal: string;
  snowHeight: string;
  snowType: string;
  opertime: string;
  isOpen: boolean;
  isNightSkiing: boolean;
  // Nová pole pro šablony a fallback
  textComment: string;      // Poznámka majitele - KRITICKÉ pro šablony
  descText: string;         // Popis (desc_text z API) - doplňkový text
  newSnow: string;          // Nový sníh
  weatherCode: number;      // Kód počasí pro emoji (1-8)
}

// === Typy pro šablony autopostingu ===

// TemplateId je nyní string pro podporu custom šablon z DB
export type TemplateId = string;

// Data pro náhled šablon (stále potřebné pro preview)
export interface TemplateData {
  textComment: string;
  descText: string;
  cameraName: string;
  weatherText: string;
  weatherCode: number;
  newSnow: string;
  isOpen: boolean;
}

// Šablona z databáze - používá content string místo generate funkce
export interface PostTemplate {
  id: string;
  name: string;
  description: string | null;
  emoji: string;
  content: string;  // Template string s placeholdery: "📢 {text_comment}\n\n📸 {kamera}"
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Typ pro vytvoření/update šablony (bez auto-generovaných polí)
export type PostTemplateInput = Omit<PostTemplate, 'id' | 'created_at' | 'updated_at'>;

// Výchozí šablony pro seed do DB
export interface DefaultTemplate {
  name: string;
  description: string;
  emoji: string;
  content: string;
  sort_order: number;
}
