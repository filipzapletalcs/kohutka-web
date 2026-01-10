import { OperationStatus, LiftStatus, SlopeStatus, Camera, Slope, Lift } from '@/types/holidayInfo';
import { fetchHolidayInfoCache, updateHolidayInfoCache } from '@/lib/supabase';

const API_URL = 'https://exports.holidayinfo.cz/xml_export.php?dc=c9ixxlejab5d4mrr&localias=kohutka';

// Fallback camera data if API fails
const FALLBACK_CAMERAS = [
  {
    id: '3122',
    name: 'Kohútka',
    description: 'Hlavní kamera',
    location: 'Areál Kohútka',
    media: {
      last_image: {
        url: 'http://data.kohutka.ski/snimky/kamera_P5_snimek.jpg',
        url_preview: 'http://data.kohutka.ski/snimky/kamera_P5_nahled.jpg',
        temp: '',
        date: '',
        time: '',
      },
    },
  },
  {
    id: '3123',
    name: 'Horní stanice',
    description: 'Sedačková lanovka',
    location: 'Horní stanice',
    media: {
      last_image: {
        url: 'http://data.kohutka.ski/snimky/kamera_P1_snimek.jpg',
        url_preview: 'http://data.kohutka.ski/snimky/kamera_P1_nahled.jpg',
        temp: '',
        date: '',
        time: '',
      },
    },
  },
];

/**
 * Parse XML string to JSON object
 */
function parseXML(xmlString: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, 'text/xml');
}

/**
 * Get text content from XML element safely
 */
function getXMLText(element: Element | null, tagName: string): string {
  if (!element) return '';
  const el = element.querySelector(tagName);
  return el?.textContent?.trim() || '';
}

/**
 * Get number from XML element safely
 */
function getXMLNumber(element: Element | null, tagName: string): number {
  const text = getXMLText(element, tagName);
  return parseInt(text) || 0;
}

/**
 * Fetch raw XML data from Holiday Info API
 */
export async function fetchHolidayInfoXML(): Promise<string> {
  try {
    // Try direct fetch (Holiday Info má CORS povolený)
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    return xmlText;
  } catch (error) {
    console.error('Error fetching Holiday Info XML:', error);
    throw error;
  }
}

// Download kód - v produkci je v environment variables, v dev módu použijeme hardcoded
const HOLIDAYINFO_DC = import.meta.env.VITE_HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';
const IS_DEV = import.meta.env.DEV;

/**
 * Helper funkce pro vytvoření URL přes proxy (produkce) nebo přímo (development)
 */
function buildProxyImageUrl(camid: string, options: { cropaspect?: string; outw?: string; outh?: string } = {}): string {
  const params = new URLSearchParams();

  // V development módu voláme Holidayinfo API přímo (jen pro testování)
  // V produkci používáme proxy endpoint
  if (IS_DEV) {
    params.append('dc', HOLIDAYINFO_DC);
    params.append('camid', camid);
    if (options.cropaspect) params.append('cropaspect', options.cropaspect);
    if (options.outw) params.append('outw', options.outw);
    if (options.outh) params.append('outh', options.outh);
    return `https://exports.holidayinfo.cz/loc_cams_lastimage.php?${params.toString()}`;
  } else {
    params.append('camid', camid);
    if (options.cropaspect) params.append('cropaspect', options.cropaspect);
    if (options.outw) params.append('outw', options.outw);
    if (options.outh) params.append('outh', options.outh);
    return `/api/holidayinfo-image?${params.toString()}`;
  }
}

function buildProxyVideoUrl(camid: string, options: { size?: string; ext?: string } = {}): string {
  const params = new URLSearchParams();

  if (IS_DEV) {
    params.append('dc', HOLIDAYINFO_DC);
    params.append('camid', camid);
    if (options.size) params.append('size', options.size);
    if (options.ext) params.append('ext', options.ext);
    return `https://exports.holidayinfo.cz/loc_cams_expvideo_lastvideofile.php?${params.toString()}`;
  } else {
    params.append('camid', camid);
    if (options.size) params.append('size', options.size);
    if (options.ext) params.append('ext', options.ext);
    return `/api/holidayinfo-video?${params.toString()}`;
  }
}

function buildProxyPanoramaUrl(camid: string, options: { cropaspect?: string; outw?: string; outh?: string } = {}): string {
  const params = new URLSearchParams();

  if (IS_DEV) {
    params.append('dc', HOLIDAYINFO_DC);
    params.append('camid', camid);
    if (options.cropaspect) params.append('cropaspect', options.cropaspect);
    if (options.outw) params.append('outw', options.outw);
    if (options.outh) params.append('outh', options.outh);
    return `https://exports.holidayinfo.cz/loc_cams_lastpanoimage.php?${params.toString()}`;
  } else {
    params.append('camid', camid);
    if (options.cropaspect) params.append('cropaspect', options.cropaspect);
    if (options.outw) params.append('outw', options.outw);
    if (options.outh) params.append('outh', options.outh);
    return `/api/holidayinfo-panorama?${params.toString()}`;
  }
}

/**
 * Parse cameras from XML
 */
export function parseCameras(xmlDoc: Document): Camera[] {
  const cameras: Camera[] = [];
  const camElements = xmlDoc.querySelectorAll('loc_cams > cam');

  camElements.forEach((camEl) => {
    const id = camEl.getAttribute('id') || '';
    const hasVideo = camEl.getAttribute('hasvideo') === '1';
    let name = getXMLText(camEl, 'name');

    // Change "Kohútka" to "Chata Kohútka"
    if (name === 'Kohútka') {
      name = 'Chata Kohútka';
    }

    const sealevel = getXMLText(camEl, 'sealevel');

    const lastImage = camEl.querySelector('media > last_image');
    if (lastImage) {
      const datetime = lastImage.getAttribute('datetime') || '';
      const temp = getXMLText(lastImage, 'temp');
      const link = getXMLText(lastImage, 'link');

      // Format datetime to readable format
      let time = '';
      let date = '';
      if (datetime && datetime.length === 14) {
        // Format: 20251022165001 -> 22.10.2025 16:50:01
        const year = datetime.substring(0, 4);
        const month = datetime.substring(4, 6);
        const day = datetime.substring(6, 8);
        const hour = datetime.substring(8, 10);
        const minute = datetime.substring(10, 12);
        date = `${day}.${month}.${year}`;
        time = `${hour}:${minute}`;
      }

      // Parse video if available
      let videoData = undefined;
      if (hasVideo) {
        const lastVideo = camEl.querySelector('media > last_video');
        if (lastVideo) {
          const videoDatetime = lastVideo.getAttribute('datetime') || '';

          // Get the full quality videofile (mp4-web-full)
          const videoFiles = lastVideo.querySelectorAll('videofile');
          let videoUrl = '';

          // Try to find full quality video first
          videoFiles.forEach((vf) => {
            if (vf.getAttribute('id') === 'mp4-web-full') {
              videoUrl = vf.textContent?.trim() || '';
            }
          });

          // Fallback to first videofile if full not found
          if (!videoUrl && videoFiles.length > 0) {
            videoUrl = videoFiles[0].textContent?.trim() || '';
          }

          if (videoUrl) {
            videoData = {
              url: videoUrl,
              datetime: videoDatetime,
              // Přidáme direct_url přes proxy pro bezpečný přístup
              direct_url: buildProxyVideoUrl(id, { size: 'full', ext: 'mp4' }),
            };
          }
        }
      }

      // Parse panorama if available
      let panoramaData = undefined;
      const lastPanoImage = camEl.querySelector('media > last_panoimage');
      if (lastPanoImage) {
        const panoDatetime = lastPanoImage.getAttribute('datetime') || '';
        panoramaData = {
          url: buildProxyPanoramaUrl(id, { cropaspect: '16:9', outw: '1920' }),
          datetime: panoDatetime,
        };
      }

      // Special handling for camera 2122 (Kohútka -> Chata Kohútka) - has panorama
      const isPanoramaCamera = id === '2122';
      const finalPanoramaData = panoramaData || (isPanoramaCamera ? {
        url: buildProxyPanoramaUrl(id, { cropaspect: '16:9', outw: '1920' }),
        datetime,
      } : undefined);

      cameras.push({
        id,
        name,
        description: `Nadmořská výška: ${sealevel}m`,
        location: sealevel,
        source: 'holidayinfo',
        hasVideo,
        hasPanorama: !!finalPanoramaData,
        media: {
          last_image: {
            // Používáme přímý odkaz z XML API
            url: link,
            url_preview: link,
            temp,
            date,
            time,
          },
          last_video: videoData,
          last_panorama: finalPanoramaData,
        },
      });
    }
  });

  // Velká sjezdovka - Live stream from i2net
  cameras.push({
    id: 'live-velka-sjezdovka',
    name: 'Velká sjezdovka',
    description: 'Live stream z velké sjezdovky',
    location: 'Horní stanice',
    hasLiveStream: true,
    liveStreamUrl: 'https://streamer.i2net.cz/live/kohutka02_.m3u8',
    media: {
      last_image: {
        url: 'https://webcams.i2net.cz/obr/kohutka-02.jpg',
        url_preview: 'https://webcams.i2net.cz/obr/kohutka-02.jpg',
        temp: '',
        date: '',
        time: '',
      },
    },
  });

  cameras.push({
    id: 'kohutka-p5',
    name: 'Kohútka',
    description: 'Náhled na areál Kohútka',
    location: 'Kohútka',
    source: 'archive',
    media: {
      last_image: {
        url: 'http://data.kohutka.ski/snimky/kamera_P5_snimek.jpg',
        url_preview: 'http://data.kohutka.ski/snimky/kamera_P5_nahled.jpg',
        temp: '',
        date: '',
        time: '',
      },
    },
  });

  cameras.push({
    id: 'kohutka-p1',
    name: 'Malá Kohútka',
    description: 'Náhled na areál Malá Kohútka',
    location: 'Malá Kohútka',
    source: 'archive',
    media: {
      last_image: {
        url: 'http://data.kohutka.ski/snimky/kamera_P1_snimek.jpg',
        url_preview: 'http://data.kohutka.ski/snimky/kamera_P1_nahled.jpg',
        temp: '',
        date: '',
        time: '',
      },
    },
  });

  // Add custom live stream cameras with direct HLS URLs
  cameras.push({
    id: 'live-kohutka',
    name: 'Kohútka',
    description: 'Live stream',
    location: 'Areál Kohútka',
    hasLiveStream: true,
    liveStreamUrl: 'https://streamer.i2net.cz/live/kohutka01_.m3u8',
    media: {
      last_image: {
        url: 'https://webcams.i2net.cz/obr/kohutka-01.jpg',
        url_preview: 'https://webcams.i2net.cz/obr/kohutka-01.jpg',
        temp: '',
        date: '',
        time: '',
      },
    },
  });

  cameras.push({
    id: 'live-mala-kohutka',
    name: 'Malá Kohútka',
    description: 'Live stream',
    location: 'Areál Malá Kohútka',
    hasLiveStream: true,
    liveStreamUrl: 'https://streamer.i2net.cz/live/kohutka03_.m3u8',
    media: {
      last_image: {
        url: 'https://webcams.i2net.cz/obr/kohutka-03.jpg',
        url_preview: 'https://webcams.i2net.cz/obr/kohutka-03.jpg',
        temp: '',
        date: '',
        time: '',
      },
    },
  });

  // If no cameras found in API, use fallback
  if (cameras.length === 0) {
    console.warn('No cameras found in API, using fallback cameras');
    return FALLBACK_CAMERAS;
  }

  // Sort cameras: 1. Panorama (Chata Kohútka), 2. Live streams, 3. Others
  const sortedCameras = cameras.sort((a, b) => {
    // Priority order
    const getPriority = (camera: Camera) => {
      if (camera.id === '2122') return 1; // Chata Kohútka (panorama) - first
      if (camera.id === 'live-kohutka') return 2; // Kohútka live stream - second
      if (camera.id === 'live-velka-sjezdovka') return 3; // Velká sjezdovka live stream - third
      if (camera.id === 'live-mala-kohutka') return 4; // Malá Kohútka live stream - fourth
      return 5; // All other cameras
    };

    return getPriority(a) - getPriority(b);
  });

  return sortedCameras;
}

/**
 * Check if it's currently night skiing time
 * Night skiing is typically after 17:00 or when opertime starts after 16:00
 */
function detectNightSkiing(opertime: string, isOpen: boolean): boolean {
  if (!isOpen || !opertime) return false;

  // Check current time (Czech timezone)
  const now = new Date();
  const czechTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }));
  const currentHour = czechTime.getHours();

  // If current time is after 17:00, it's night skiing
  if (currentHour >= 17) {
    return true;
  }

  // Also check if opertime indicates night skiing (starts after 16:00)
  // Format: "08:30-18:00" or "17:00-21:00"
  const match = opertime.match(/^(\d{2}):(\d{2})/);
  if (match) {
    const startHour = parseInt(match[1], 10);
    if (startHour >= 16) {
      return true;
    }
  }

  return false;
}

/**
 * Get operation status from XML
 */
export function parseOperationStatus(xmlDoc: Document): OperationStatus {
  const locInfoWinter = xmlDoc.querySelector('loc_info_winter');

  const operationCode = getXMLNumber(locInfoWinter, 'operation_code');
  const operationText = getXMLText(locInfoWinter, 'operation_text');
  const opertime = getXMLText(locInfoWinter, 'opertime');
  const weather = getXMLText(locInfoWinter, 'weather_0700_text');
  const tempDefault = getXMLText(locInfoWinter, 'temp_0700');

  // Try to get temperature from "Chata Kohútka" panorama camera (ID 2122)
  let temperature = '';
  const chataKohutkaCam = xmlDoc.querySelector('loc_cams > cam[id="2122"]');
  if (chataKohutkaCam) {
    const lastImage = chataKohutkaCam.querySelector('media > last_image');
    if (lastImage) {
      temperature = getXMLText(lastImage, 'temp');
    }
  }

  // Fallback to default temperature from weather report
  if (!temperature) {
    temperature = tempDefault;
  }

  // Snow height
  const snowMin = getXMLText(locInfoWinter, 'snowheight_slopes_min');
  const snowMax = getXMLText(locInfoWinter, 'snowheight_slopes_max');
  let snowHeight = '';
  if (snowMin && snowMax) {
    // If both values are the same, show just one (e.g., "0 cm" instead of "0 - 0 cm")
    if (snowMin === snowMax) {
      snowHeight = `${snowMin} cm`;
    } else {
      snowHeight = `${snowMin} - ${snowMax} cm`;
    }
  } else if (snowMin) {
    snowHeight = `${snowMin} cm`;
  } else if (snowMax) {
    snowHeight = `${snowMax} cm`;
  }

  // Snow type
  const snowType = getXMLText(locInfoWinter, 'snowtype_text')?.trim() || '';

  // Nová pole pro autoposting šablony
  const textComment = getXMLText(locInfoWinter, 'text_comment')?.trim() || '';
  const newSnowRaw = getXMLText(locInfoWinter, 'snowheight_new')?.trim() || '';
  const newSnow = newSnowRaw && newSnowRaw !== '0' ? `${newSnowRaw} cm` : '';
  const weatherCode = getXMLNumber(locInfoWinter, 'weather_0700_code');

  // Operation codes: 1,2 = closed, 3,4 = open
  const isOpen = operationCode === 3 || operationCode === 4;

  // Detect night skiing
  const cleanOpertime = opertime === '00:00-00:00' ? '' : opertime;
  const isNightSkiing = detectNightSkiing(cleanOpertime, isOpen);

  return {
    isOpen,
    isNightSkiing,
    operationText: operationText === 'N/A' ? '' : operationText,
    opertime: cleanOpertime,
    temperature,
    weather: weather === '-' ? '' : weather,
    snowHeight,
    snowType,
    // Nová pole pro autoposting
    textComment,
    newSnow,
    weatherCode,
  };
}

/**
 * Get lift status from XML
 */
export function parseLiftStatus(xmlDoc: Document): LiftStatus {
  const liftElements = xmlDoc.querySelectorAll('loc_lifts > lift');
  let openCount = 0;
  let totalCount = 0;
  let skiParkOpen = false;

  // Lanovky (sedačkové/kabinkové) - type_code 1, 2
  let cableCarOpenCount = 0;
  let cableCarTotalCount = 0;

  // Vleky včetně skiparku - type_code 3, 5, 6, 7
  let dragLiftOpenCount = 0;
  let dragLiftTotalCount = 0;

  liftElements.forEach((liftEl) => {
    const statusCode = getXMLNumber(liftEl, 'status_code');
    const typeCode = getXMLNumber(liftEl, 'type_code');
    const isOpen = statusCode === 1 || statusCode === 3;

    // Skipark (type 7) - sledujeme zvlášť pro widget
    if (typeCode === 7) {
      if (isOpen) {
        skiParkOpen = true;
      }
    }

    // Všechny lifty počítáme do celkového počtu
    totalCount++;
    if (isOpen) {
      openCount++;
    }

    // Lanovky (sedačkové, kabinkové, čtyřsedačky) - type_code 1, 2, 4
    if (typeCode === 1 || typeCode === 2 || typeCode === 4) {
      cableCarTotalCount++;
      if (isOpen) {
        cableCarOpenCount++;
      }
    }
    // Vleky včetně skiparku - type_code 3, 5, 6, 7
    else if (typeCode === 3 || typeCode === 5 || typeCode === 6 || typeCode === 7) {
      dragLiftTotalCount++;
      if (isOpen) {
        dragLiftOpenCount++;
      }
    }
  });

  return {
    openCount,
    totalCount,
    skiParkOpen,
    cableCarOpenCount,
    cableCarTotalCount,
    dragLiftOpenCount,
    dragLiftTotalCount,
  };
}

/**
 * Get slope status from XML
 */
export function parseSlopeStatus(xmlDoc: Document): SlopeStatus {
  const slopeElements = xmlDoc.querySelectorAll('loc_slopes > slope');
  let openCount = 0;
  let totalCount = 0;

  slopeElements.forEach((slopeEl) => {
    const statusCode = getXMLNumber(slopeEl, 'status_code');
    totalCount++;

    // Status codes: 2,6 = open
    if (statusCode === 2 || statusCode === 6) {
      openCount++;
    }
  });

  return {
    openCount,
    totalCount,
  };
}

/**
 * Parse slopes with detailed information
 */
export function parseSlopes(xmlDoc: Document): Slope[] {
  const slopeElements = xmlDoc.querySelectorAll('loc_slopes > slope');
  const slopes: Slope[] = [];

  slopeElements.forEach((slopeEl) => {
    slopes.push({
      id: slopeEl.getAttribute('id') || '',
      name: getXMLText(slopeEl, 'name'),
      status_code: getXMLNumber(slopeEl, 'status_code'),
      status_text: getXMLText(slopeEl, 'status_text'),
      diff_code: getXMLNumber(slopeEl, 'diff_code'),
      diff_text: getXMLText(slopeEl, 'diff_text'),
      exceed: getXMLNumber(slopeEl, 'exceed'),
      length: getXMLNumber(slopeEl, 'length'),
      nightskiing_code: getXMLNumber(slopeEl, 'nightskiing_code'),
      nightskiing_text: getXMLText(slopeEl, 'nightskiing_text'),
      snowmaking_code: getXMLNumber(slopeEl, 'snowmaking_code'),
      snowmaking_text: getXMLText(slopeEl, 'snowmaking_text'),
    });
  });

  return slopes;
}

/**
 * Parse lifts with detailed information
 */
export function parseLifts(xmlDoc: Document): Lift[] {
  const liftElements = xmlDoc.querySelectorAll('loc_lifts > lift');
  const lifts: Lift[] = [];

  liftElements.forEach((liftEl) => {
    lifts.push({
      id: liftEl.getAttribute('id') || '',
      name: getXMLText(liftEl, 'name'),
      status_code: getXMLNumber(liftEl, 'status_code'),
      status_text: getXMLText(liftEl, 'status_text'),
      type_code: getXMLNumber(liftEl, 'type_code'),
      type_text: getXMLText(liftEl, 'type_text'),
      capacity: getXMLNumber(liftEl, 'capacity'),
      length: getXMLNumber(liftEl, 'length'),
      nightskiing_code: getXMLNumber(liftEl, 'nightskiing_code'),
      nightskiing_text: getXMLText(liftEl, 'nightskiing_text'),
    });
  });

  return lifts;
}

/**
 * Build fallback data from Supabase cache
 */
async function getFallbackFromCache() {
  try {
    const cache = await fetchHolidayInfoCache();
    if (cache) {
      console.log('Using cached HolidayInfo data from', cache.updated_at);
      const opertime = cache.opertime || '';
      const isOpen = cache.is_open;
      // Detekce večerního lyžování z cached dat (nightskiing_code !== 1 = aktivní)
      const slopesDetailed = cache.slopes_detailed || [];
      const liftsDetailed = cache.lifts_detailed || [];
      const hasNightSkiingFromApi = slopesDetailed.some((s: { nightskiing_code: number }) => s.nightskiing_code !== 1) ||
                                    liftsDetailed.some((l: { nightskiing_code: number }) => l.nightskiing_code !== 1);
      return {
        cameras: FALLBACK_CAMERAS,
        operation: {
          isOpen,
          isNightSkiing: hasNightSkiingFromApi,
          operationText: cache.operation_text || 'mimo provoz',
          opertime,
          temperature: cache.temperature || '',
          weather: cache.weather || '',
          snowHeight: cache.snow_height || '',
          snowType: cache.snow_type || '',
          textComment: '',
          newSnow: '',
          weatherCode: 0,
        },
        lifts: {
          openCount: cache.lifts_open_count,
          totalCount: cache.lifts_total_count,
          skiParkOpen: cache.skipark_open,
          cableCarOpenCount: cache.cable_car_open_count,
          cableCarTotalCount: cache.cable_car_total_count,
          dragLiftOpenCount: cache.drag_lift_open_count,
          dragLiftTotalCount: cache.drag_lift_total_count,
        },
        slopes: {
          openCount: cache.slopes_open_count,
          totalCount: cache.slopes_total_count,
        },
        slopesDetailed: cache.slopes_detailed || [],
        liftsDetailed: cache.lifts_detailed || [],
        rawXML: '',
        fromCache: true,
        cacheUpdatedAt: cache.updated_at,
      };
    }
  } catch (cacheError) {
    console.error('Error fetching cache:', cacheError);
  }

  // No cache available, return hardcoded fallback
  return {
    cameras: FALLBACK_CAMERAS,
    operation: {
      isOpen: false,
      isNightSkiing: false,
      operationText: 'Data nedostupná',
      opertime: '',
      temperature: '',
      weather: '',
      snowHeight: '',
      snowType: '',
      textComment: '',
      newSnow: '',
      weatherCode: 0,
    },
    lifts: {
      openCount: 0,
      totalCount: 0,
      skiParkOpen: false,
      cableCarOpenCount: 0,
      cableCarTotalCount: 0,
      dragLiftOpenCount: 0,
      dragLiftTotalCount: 0,
    },
    slopes: {
      openCount: 0,
      totalCount: 0,
    },
    slopesDetailed: [],
    liftsDetailed: [],
    rawXML: '',
    fromCache: false,
  };
}

/**
 * Save data to Supabase cache
 */
async function saveToCache(data: {
  operation: OperationStatus;
  lifts: LiftStatus;
  slopes: SlopeStatus;
  slopesDetailed: Slope[];
  liftsDetailed: Lift[];
}) {
  try {
    await updateHolidayInfoCache({
      is_open: data.operation.isOpen,
      operation_text: data.operation.operationText,
      opertime: data.operation.opertime,
      temperature: data.operation.temperature,
      weather: data.operation.weather,
      snow_height: data.operation.snowHeight,
      snow_type: data.operation.snowType,
      lifts_open_count: data.lifts.openCount,
      lifts_total_count: data.lifts.totalCount,
      skipark_open: data.lifts.skiParkOpen,
      cable_car_open_count: data.lifts.cableCarOpenCount,
      cable_car_total_count: data.lifts.cableCarTotalCount,
      drag_lift_open_count: data.lifts.dragLiftOpenCount,
      drag_lift_total_count: data.lifts.dragLiftTotalCount,
      slopes_open_count: data.slopes.openCount,
      slopes_total_count: data.slopes.totalCount,
      slopes_detailed: data.slopesDetailed,
      lifts_detailed: data.liftsDetailed,
    });
    console.log('HolidayInfo data saved to cache');
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
}

/**
 * Fetch and parse all Holiday Info data
 */
export async function fetchHolidayInfoData() {
  try {
    const xmlText = await fetchHolidayInfoXML();
    const xmlDoc = parseXML(xmlText);

    // Check status
    const statusEl = xmlDoc.querySelector('retstatus > status');
    const status = statusEl?.textContent?.trim();

    if (status === 'err') {
      const errors = Array.from(xmlDoc.querySelectorAll('retstatus > err'))
        .map(el => el.textContent)
        .join(', ');
      console.error('Holiday Info API returned error:', errors);
      // Try to get cached data
      return await getFallbackFromCache();
    }

    const operation = parseOperationStatus(xmlDoc);
    const lifts = parseLiftStatus(xmlDoc);
    const slopes = parseSlopeStatus(xmlDoc);
    const slopesDetailed = parseSlopes(xmlDoc);
    const liftsDetailed = parseLifts(xmlDoc);

    // Detekce večerního lyžování z API dat (nightskiing_code !== 1 = aktivní)
    // Přepíše časově-založenou detekci z parseOperationStatus
    const hasNightSkiingFromApi = slopesDetailed.some(s => s.nightskiing_code !== 1) ||
                                  liftsDetailed.some(l => l.nightskiing_code !== 1);
    operation.isNightSkiing = hasNightSkiingFromApi;

    // Only save to cache if we have actual data (prevent overwriting with empty data)
    const hasData = slopes.totalCount > 0 || lifts.totalCount > 0;
    if (hasData) {
      // Save to cache (don't await to not block the response)
      saveToCache({ operation, lifts, slopes, slopesDetailed, liftsDetailed });

      return {
        cameras: parseCameras(xmlDoc),
        operation,
        lifts,
        slopes,
        slopesDetailed,
        liftsDetailed,
        rawXML: xmlText,
        fromCache: false,
      };
    } else {
      // API returned empty data - use cache instead
      console.warn('Holiday Info API returned empty data, using cache fallback');
      const cachedData = await getFallbackFromCache();
      // Still return cameras from API (they might be valid)
      return {
        ...cachedData,
        cameras: parseCameras(xmlDoc).length > 0 ? parseCameras(xmlDoc) : cachedData.cameras,
        rawXML: xmlText,
      };
    }
  } catch (error) {
    console.error('Error fetching Holiday Info data:', error);
    // Try to get cached data
    return await getFallbackFromCache();
  }
}
