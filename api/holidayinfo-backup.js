/**
 * API Endpoint pro pravidelný backup Holiday Info dat
 * Spouštěn cronjobem každých 20 minut
 *
 * GET /api/holidayinfo-backup
 * Returns: { success: boolean, message: string, data?: object }
 */

import { createClient } from '@supabase/supabase-js';

// Holiday Info API config
const HOLIDAYINFO_API = 'https://exports.holidayinfo.cz/xml_export.php';
const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';

// Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtnchzadjrmgfvhfzpzh.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bmNoemFkanJtZ2Z2aGZ6cHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYyNDAsImV4cCI6MjA4MDQ1MjI0MH0.gaCkl1hs_RKpbtHbSOMGbkAa4dCPgh6erEq524lSDk0';

/**
 * Helper pro extrakci textu z XML elementu
 */
function getXMLText(element, tagName) {
  if (!element) return '';
  const els = element.getElementsByTagName(tagName);
  return els[0]?.textContent?.trim() || '';
}

/**
 * Helper pro extrakci čísla z XML elementu
 */
function getXMLNumber(element, tagName) {
  const text = getXMLText(element, tagName);
  return parseInt(text) || 0;
}

/**
 * Parsuje operační status z XML
 */
function parseOperationStatus(xmlDoc) {
  const locInfoWinter = xmlDoc.getElementsByTagName('loc_info_winter')[0];

  const operationCode = getXMLNumber(locInfoWinter, 'operation_code');
  const operationText = getXMLText(locInfoWinter, 'operation_text');
  const opertime = getXMLText(locInfoWinter, 'opertime');
  const weather = getXMLText(locInfoWinter, 'weather_0700_text');
  const tempDefault = getXMLText(locInfoWinter, 'temp_0700');

  // Teplota z kamery 2122 (Chata Kohútka)
  let temperature = '';
  const cams = xmlDoc.getElementsByTagName('cam');
  for (let i = 0; i < cams.length; i++) {
    if (cams[i].getAttribute('id') === '2122') {
      const lastImage = cams[i].getElementsByTagName('last_image')[0];
      temperature = getXMLText(lastImage, 'temp');
      break;
    }
  }
  if (!temperature) {
    temperature = tempDefault;
  }

  // Výška sněhu
  const snowMin = getXMLText(locInfoWinter, 'snowheight_slopes_min');
  const snowMax = getXMLText(locInfoWinter, 'snowheight_slopes_max');
  let snowHeight = '';
  if (snowMin && snowMax) {
    snowHeight = snowMin === snowMax ? `${snowMin} cm` : `${snowMin} - ${snowMax} cm`;
  } else if (snowMin) {
    snowHeight = `${snowMin} cm`;
  } else if (snowMax) {
    snowHeight = `${snowMax} cm`;
  }

  // Typ sněhu
  const snowType = getXMLText(locInfoWinter, 'snowtype_text')?.trim() || '';

  // Nová pole pro variabilitu captionů
  const textComment = getXMLText(locInfoWinter, 'text_comment')?.trim() || '';
  const newSnowRaw = getXMLText(locInfoWinter, 'snowheight_new')?.trim() || '';
  const newSnow = newSnowRaw && newSnowRaw !== '0' ? newSnowRaw : '';
  const weatherCode = getXMLNumber(locInfoWinter, 'weather_0700_code');
  const tempMorning = tempDefault; // temp_0700
  const snowOutsideSlopes = getXMLText(locInfoWinter, 'snowheight_outside_slopes')?.trim() || '';

  // Hodnocení areálu
  const locevalEl = xmlDoc.getElementsByTagName('loceval')[0];
  const valuesEl = locevalEl?.getElementsByTagName('values')[0];
  const ratingAvg = valuesEl?.getAttribute('avg') || '';
  const ratingCount = valuesEl?.getAttribute('numevals') || '';

  const isOpen = operationCode === 3 || operationCode === 4;

  return {
    isOpen,
    operationText: operationText === 'N/A' ? '' : operationText,
    opertime: opertime === '00:00-00:00' ? '' : opertime,
    temperature,
    weather: weather === '-' ? '' : weather,
    snowHeight,
    snowType,
    // Nová pole
    textComment,
    newSnow,
    weatherCode,
    tempMorning,
    snowOutsideSlopes,
    ratingAvg: ratingAvg ? parseFloat(ratingAvg) : null,
    ratingCount: ratingCount ? parseInt(ratingCount) : null,
  };
}

/**
 * Parsuje status lanovek/vleků z XML
 */
function parseLiftStatus(xmlDoc) {
  const lifts = xmlDoc.getElementsByTagName('lift');
  let openCount = 0;
  let totalCount = 0;
  let skiParkOpen = false;
  let cableCarOpenCount = 0;
  let cableCarTotalCount = 0;
  let dragLiftOpenCount = 0;
  let dragLiftTotalCount = 0;

  for (let i = 0; i < lifts.length; i++) {
    const statusCode = getXMLNumber(lifts[i], 'status_code');
    const typeCode = getXMLNumber(lifts[i], 'type_code');
    const isOpen = statusCode === 1 || statusCode === 3;

    // Skipark (type 7)
    if (typeCode === 7 && isOpen) {
      skiParkOpen = true;
    }

    totalCount++;
    if (isOpen) openCount++;

    // Lanovky (sedačkové, kabinkové, čtyřsedačky)
    if (typeCode === 1 || typeCode === 2 || typeCode === 4) {
      cableCarTotalCount++;
      if (isOpen) cableCarOpenCount++;
    }
    // Vleky včetně skiparku
    else if (typeCode === 3 || typeCode === 5 || typeCode === 6 || typeCode === 7) {
      dragLiftTotalCount++;
      if (isOpen) dragLiftOpenCount++;
    }
  }

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
 * Parsuje status sjezdovek z XML
 */
function parseSlopeStatus(xmlDoc) {
  const slopes = xmlDoc.getElementsByTagName('slope');
  let openCount = 0;
  const totalCount = slopes.length;

  for (let i = 0; i < slopes.length; i++) {
    const statusCode = getXMLNumber(slopes[i], 'status_code');
    if (statusCode === 2 || statusCode === 6) {
      openCount++;
    }
  }

  return { openCount, totalCount };
}

/**
 * Parsuje detailní data sjezdovek z XML
 */
function parseSlopesDetailed(xmlDoc) {
  const slopes = xmlDoc.getElementsByTagName('slope');
  const result = [];

  for (let i = 0; i < slopes.length; i++) {
    const slope = slopes[i];
    result.push({
      id: slope.getAttribute('id') || '',
      name: getXMLText(slope, 'name'),
      status_code: getXMLNumber(slope, 'status_code'),
      status_text: getXMLText(slope, 'status_text'),
      diff_code: getXMLNumber(slope, 'diff_code'),
      diff_text: getXMLText(slope, 'diff_text'),
      exceed: getXMLNumber(slope, 'exceed'),
      length: getXMLNumber(slope, 'length'),
      nightskiing_code: getXMLNumber(slope, 'nightskiing_code'),
      nightskiing_text: getXMLText(slope, 'nightskiing_text'),
      snowmaking_code: getXMLNumber(slope, 'snowmaking_code'),
      snowmaking_text: getXMLText(slope, 'snowmaking_text'),
    });
  }

  return result;
}

/**
 * Parsuje detailní data lanovek/vleků z XML
 */
function parseLiftsDetailed(xmlDoc) {
  const lifts = xmlDoc.getElementsByTagName('lift');
  const result = [];

  for (let i = 0; i < lifts.length; i++) {
    const lift = lifts[i];
    result.push({
      id: lift.getAttribute('id') || '',
      name: getXMLText(lift, 'name'),
      status_code: getXMLNumber(lift, 'status_code'),
      status_text: getXMLText(lift, 'status_text'),
      type_code: getXMLNumber(lift, 'type_code'),
      type_text: getXMLText(lift, 'type_text'),
      capacity: getXMLNumber(lift, 'capacity'),
      length: getXMLNumber(lift, 'length'),
      nightskiing_code: getXMLNumber(lift, 'nightskiing_code'),
      nightskiing_text: getXMLText(lift, 'nightskiing_text'),
    });
  }

  return result;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // 1. Fetch XML from Holiday Info API
    console.log('[HolidayInfo Backup] Fetching data from API...');
    const response = await fetch(`${HOLIDAYINFO_API}?dc=${HOLIDAYINFO_DC}&localias=kohutka`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const xmlText = await response.text();

    // 2. Parse XML
    const { DOMParser } = await import('@xmldom/xmldom');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for API errors
    const statusEl = xmlDoc.getElementsByTagName('status')[0];
    if (statusEl?.textContent === 'err') {
      const errEl = xmlDoc.getElementsByTagName('err')[0];
      throw new Error(`API error: ${errEl?.textContent || 'Unknown error'}`);
    }

    // 3. Parse all data
    const operation = parseOperationStatus(xmlDoc);
    const lifts = parseLiftStatus(xmlDoc);
    const slopes = parseSlopeStatus(xmlDoc);
    const slopesDetailed = parseSlopesDetailed(xmlDoc);
    const liftsDetailed = parseLiftsDetailed(xmlDoc);

    // 4. Save to Supabase
    console.log('[HolidayInfo Backup] Saving to database...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cacheData = {
      id: 'main',
      is_open: operation.isOpen,
      operation_text: operation.operationText,
      opertime: operation.opertime,
      temperature: operation.temperature,
      weather: operation.weather,
      snow_height: operation.snowHeight,
      snow_type: operation.snowType,
      new_snow: operation.newSnow,
      // Nová pole pro variabilitu captionů
      text_comment: operation.textComment,
      weather_code: operation.weatherCode,
      temp_morning: operation.tempMorning,
      snow_outside_slopes: operation.snowOutsideSlopes,
      rating_avg: operation.ratingAvg,
      rating_count: operation.ratingCount,
      // Existující pole
      lifts_open_count: lifts.openCount,
      lifts_total_count: lifts.totalCount,
      skipark_open: lifts.skiParkOpen,
      cable_car_open_count: lifts.cableCarOpenCount,
      cable_car_total_count: lifts.cableCarTotalCount,
      drag_lift_open_count: lifts.dragLiftOpenCount,
      drag_lift_total_count: lifts.dragLiftTotalCount,
      slopes_open_count: slopes.openCount,
      slopes_total_count: slopes.totalCount,
      slopes_detailed: slopesDetailed,
      lifts_detailed: liftsDetailed,
      updated_at: new Date().toISOString(),
      last_successful_fetch: new Date().toISOString(),
      fetch_source: 'cronjob',
    };

    const { error: upsertError } = await supabase.from('holidayinfo_cache').upsert(cacheData);

    if (upsertError) {
      throw new Error(`Database error: ${upsertError.message}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[HolidayInfo Backup] Success in ${duration}ms`);

    return res.status(200).json({
      success: true,
      message: `Backup completed in ${duration}ms`,
      data: {
        isOpen: operation.isOpen,
        temperature: operation.temperature,
        snowHeight: operation.snowHeight,
        liftsOpen: lifts.openCount,
        liftsTotal: lifts.totalCount,
        slopesOpen: slopes.openCount,
        slopesTotal: slopes.totalCount,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[HolidayInfo Backup] Failed after ${duration}ms:`, error.message);

    return res.status(500).json({
      success: false,
      error: error.message,
      duration: `${duration}ms`,
    });
  }
}
