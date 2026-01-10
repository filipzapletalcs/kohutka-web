export interface StatusImageData {
  isOpen: boolean;
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
  temperature: string;
  liftsOpen: string;
  liftsTotal: string;
  slopesOpen: string;
  slopesTotal: string;
  snowHeight: string;
  isOpen: boolean;
}

// === Typy pro šablony autopostingu ===

export type TemplateId = 'daily' | 'weather' | 'morning' | 'brief' | 'custom';

export interface TemplateData {
  textComment: string;
  cameraName: string;
  weatherText: string;
  weatherCode: number;
  newSnow: string;
  isOpen: boolean;
}

export interface PostTemplate {
  id: TemplateId;
  name: string;
  description: string;
  emoji: string;
  generate: (data: TemplateData) => string;
}
