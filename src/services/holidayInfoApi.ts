import { OperationStatus, LiftStatus, SlopeStatus, Camera, Slope, Lift } from '@/types/holidayInfo';

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

/**
 * Parse cameras from XML
 */
export function parseCameras(xmlDoc: Document): Camera[] {
  const cameras: Camera[] = [];
  const camElements = xmlDoc.querySelectorAll('loc_cams > cam');

  camElements.forEach((camEl) => {
    const id = camEl.getAttribute('id') || '';
    const hasVideo = camEl.getAttribute('hasvideo') === '1';
    const name = getXMLText(camEl, 'name');
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
            };
          }
        }
      }

      cameras.push({
        id,
        name,
        description: `Nadmořská výška: ${sealevel}m`,
        location: sealevel,
        hasVideo,
        media: {
          last_image: {
            url: link,
            url_preview: link, // Same as full image
            temp,
            date,
            time,
          },
          last_video: videoData,
        },
      });
    }
  });

  // If no cameras found in API, use fallback
  if (cameras.length === 0) {
    console.warn('No cameras found in API, using fallback cameras');
    return FALLBACK_CAMERAS;
  }

  return cameras;
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

  // Try to get temperature from camera 3122 (peak camera)
  const peakCam = xmlDoc.querySelector('loc_cams > cam[id="3122"]');
  const tempPeak = peakCam ? getXMLText(peakCam, 'temp') : '';
  const temperature = tempPeak || tempDefault;

  // Snow height
  const snowMin = getXMLText(locInfoWinter, 'snowheight_slopes_min');
  const snowMax = getXMLText(locInfoWinter, 'snowheight_slopes_max');
  let snowHeight = '';
  if (snowMin && snowMax) {
    snowHeight = `${snowMin} - ${snowMax} cm`;
  } else if (snowMin) {
    snowHeight = `${snowMin} cm`;
  } else if (snowMax) {
    snowHeight = `${snowMax} cm`;
  }

  // Operation codes: 1,2 = closed, 3,4 = open
  const isOpen = operationCode === 3 || operationCode === 4;

  return {
    isOpen,
    operationText: operationText === 'N/A' ? '' : operationText,
    opertime: opertime === '00:00-00:00' ? '' : opertime,
    temperature,
    weather: weather === '-' ? '' : weather,
    snowHeight,
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

  liftElements.forEach((liftEl) => {
    const statusCode = getXMLNumber(liftEl, 'status_code');
    const typeCode = getXMLNumber(liftEl, 'type_code');

    // Type 7 = Skipark for Children
    if (typeCode === 7) {
      if (statusCode !== 2) { // 2 = out of operation
        skiParkOpen = true;
      }
    } else {
      totalCount++;
      // Status codes: 1,3 = open, 2 = closed
      if (statusCode === 1 || statusCode === 3) {
        openCount++;
      }
    }
  });

  return {
    openCount,
    totalCount,
    skiParkOpen,
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
      // Return fallback data instead of throwing
      return {
        cameras: FALLBACK_CAMERAS,
        operation: {
          isOpen: false,
          operationText: 'mimo provoz',
          opertime: '',
          temperature: '',
          weather: '',
          snowHeight: '',
        },
        lifts: {
          openCount: 0,
          totalCount: 0,
          skiParkOpen: false,
        },
        slopes: {
          openCount: 0,
          totalCount: 0,
        },
        slopesDetailed: [],
        liftsDetailed: [],
        rawXML: xmlText,
      };
    }

    return {
      cameras: parseCameras(xmlDoc),
      operation: parseOperationStatus(xmlDoc),
      lifts: parseLiftStatus(xmlDoc),
      slopes: parseSlopeStatus(xmlDoc),
      slopesDetailed: parseSlopes(xmlDoc),
      liftsDetailed: parseLifts(xmlDoc),
      rawXML: xmlText,
    };
  } catch (error) {
    console.error('Error fetching Holiday Info data:', error);
    // Return fallback data on any error
    return {
      cameras: FALLBACK_CAMERAS,
      operation: {
        isOpen: false,
        operationText: 'Data nedostupná',
        opertime: '',
        temperature: '',
        weather: '',
        snowHeight: '',
      },
      lifts: {
        openCount: 0,
        totalCount: 0,
        skiParkOpen: false,
      },
      slopes: {
        openCount: 0,
        totalCount: 0,
      },
      slopesDetailed: [],
      liftsDetailed: [],
      rawXML: '',
    };
  }
}
