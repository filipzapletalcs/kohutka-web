// Holiday Info API Types based on WordPress plugin analysis

/**
 * Zdroj dat pro kameru
 */
export type CameraSource = 'holidayinfo' | 'i2net' | 'archive';

/**
 * Unified Camera interface podporující Holiday Info i i2net kamery
 */
export interface Camera {
  id: string;
  name: string;
  description: string;
  location: string;
  source?: CameraSource; // Zdroj dat (holidayinfo nebo i2net)
  hasVideo?: boolean;
  hasLiveStream?: boolean;
  liveStreamUrl?: string;
  hasPanorama?: boolean;
  panoramaUrl?: string;
  updateInterval?: number; // Interval aktualizace v minutách (0 = live stream)
  media: {
    last_image: {
      url: string;
      url_preview: string;
      temp?: string;
      date?: string;
      time?: string;
    };
    last_video?: {
      url: string;
      datetime?: string;
      // Přímý přístup k video souboru přes proxy
      direct_url?: string;
    };
    last_panorama?: {
      url: string;
      datetime?: string;
    };
  };
}

export interface Slope {
  id: string;
  name: string;
  status_code: number;
  status_text: string;
  diff_code: number;
  diff_text: string;
  exceed: number;
  length: number;
  nightskiing_code: number;
  nightskiing_text: string;
  snowmaking_code: number;
  snowmaking_text: string;
}

export interface Lift {
  id: string;
  name: string;
  status_code: number;
  status_text: string;
  type_code: number;
  type_text: string;
  capacity: number;
  length: number;
  nightskiing_code: number;
  nightskiing_text: string;
}

export interface LocationInfoWinter {
  operation_code: number;
  operation_text: string;
  opertime: string;
  snowheight_slopes_min: string;
  snowheight_slopes_max: string;
  weather_0700_text: string;
  temp_0700: string;
}

export interface HolidayInfoData {
  location: {
    loc_info_winter: LocationInfoWinter;
    loc_slopes: {
      slope: Slope[];
    };
    loc_lifts: {
      lift: Lift[];
    };
    loc_cams: {
      cam: Camera[];
    };
  };
}

export interface OperationStatus {
  isOpen: boolean;
  isNightSkiing: boolean;
  operationText: string;
  opertime: string;
  temperature: string;
  weather: string;
  snowHeight: string;
  snowType: string;
  // Pro autoposting šablony
  textComment: string;      // Poznámka majitele z Holiday Info
  newSnow: string;          // Nový sníh
  weatherCode: number;      // Kód počasí pro emoji
}

export interface LiftStatus {
  openCount: number;
  totalCount: number;
  skiParkOpen: boolean;
  // Lanovky (sedačkové/kabinkové) - type_code 1, 2
  cableCarOpenCount: number;
  cableCarTotalCount: number;
  // Vleky - type_code 3, 4, 5, 6
  dragLiftOpenCount: number;
  dragLiftTotalCount: number;
}

export interface SlopeStatus {
  openCount: number;
  totalCount: number;
}
