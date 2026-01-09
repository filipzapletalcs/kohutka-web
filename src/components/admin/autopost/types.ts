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
