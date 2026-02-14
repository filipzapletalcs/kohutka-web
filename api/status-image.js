/**
 * API Endpoint pro generování status obrázků pro sociální sítě
 * Používá Puppeteer pro screenshot React komponenty - 100% identické s admin náhledem
 *
 * Data source: DB-first (cache + manual overrides), fallback na přímý HolidayInfo API call
 *
 * GET /api/status-image
 * Query params:
 *   - format: 'png' (default)
 *   - width: number (default: 1080)
 *   - height: number (default: 1350)
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

// Holiday Info API config (fallback)
const HOLIDAYINFO_API = 'https://exports.holidayinfo.cz/xml_export.php';
const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';

// Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtnchzadjrmgfvhfzpzh.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bmNoemFkanJtZ2Z2aGZ6cHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYyNDAsImV4cCI6MjA4MDQ1MjI0MH0.gaCkl1hs_RKpbtHbSOMGbkAa4dCPgh6erEq524lSDk0';

// Browser instance cache (pro rychlejší generování)
let browserInstance = null;

const DEFAULT_WIDTH = 1080;
const DEFAULT_HEIGHT = 1350;

/**
 * Získá nebo vytvoří Puppeteer browser instanci
 */
async function getBrowser() {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--font-render-hinting=none',
    ],
  };

  // Na produkci (Linux VPS) použij systémový Chromium
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  browserInstance = await puppeteer.launch(launchOptions);

  return browserInstance;
}

/**
 * Helper pro extrakci textu z XML elementu
 */
function getXMLText(element, tagName) {
  if (!element) return '';
  const els = element.getElementsByTagName(tagName);
  return els[0]?.textContent?.trim() || '';
}

/**
 * Merge DB manual overrides with HolidayInfo API cache data
 * Priority: DB manual values > API data
 * (Same logic as in generate-caption.js and facebook-post.js)
 */
function mergeDataSources(holidayInfoCache, widgetSettings, slopesLiftsOverrides) {
  const merged = { ...holidayInfoCache };

  // Apply widget overrides
  widgetSettings.forEach(widget => {
    if (widget.mode !== 'manual' || !widget.manual_value) return;

    switch (widget.widget_key) {
      case 'skiareal':
        if (widget.manual_status === 'open') merged.is_open = true;
        else if (widget.manual_status === 'closed') merged.is_open = false;
        if (widget.manual_value) merged.opertime = widget.manual_value;
        break;
      case 'pocasi':
        if (widget.manual_value) merged.temperature = widget.manual_value;
        break;
      case 'snih':
        if (widget.manual_value) merged.snow_height = widget.manual_value;
        break;
      case 'skipark':
        if (widget.manual_status === 'open') merged.skipark_open = true;
        else if (widget.manual_status === 'closed') merged.skipark_open = false;
        break;
      case 'vleky':
        if (widget.manual_value) {
          const match = widget.manual_value.match(/^(\d+)(?:\/(\d+))?$/);
          if (match) {
            merged.lifts_open_count = parseInt(match[1], 10);
            if (match[2]) merged.lifts_total_count = parseInt(match[2], 10);
          }
        }
        break;
      case 'sjezdovky':
        if (widget.manual_value) {
          const match = widget.manual_value.match(/^(\d+)(?:\/(\d+))?$/);
          if (match) {
            merged.slopes_open_count = parseInt(match[1], 10);
            if (match[2]) merged.slopes_total_count = parseInt(match[2], 10);
          }
        }
        break;
    }
  });

  // Apply slopes/lifts individual overrides
  if (slopesLiftsOverrides.length > 0) {
    const overrideMap = new Map();
    slopesLiftsOverrides.forEach(override => {
      if (override.mode === 'manual') {
        overrideMap.set(`${override.type}_${override.name}`, override.is_open);
      }
    });

    // Apply to slopes_detailed
    if (Array.isArray(merged.slopes_detailed)) {
      let manualSlopesOpenCount = 0;
      merged.slopes_detailed = merged.slopes_detailed.map(slope => {
        const key = `slope_${slope.name}`;
        if (overrideMap.has(key)) {
          const isOpen = overrideMap.get(key);
          if (isOpen) manualSlopesOpenCount++;
          return { ...slope, status_code: isOpen ? 2 : 3 };
        }
        if (slope.status_code === 2) manualSlopesOpenCount++;
        return slope;
      });
      merged.slopes_open_count = manualSlopesOpenCount;
    }

    // Apply to lifts_detailed
    if (Array.isArray(merged.lifts_detailed)) {
      let manualLiftsOpenCount = 0;
      let manualCableCarOpenCount = 0;
      let manualDragLiftOpenCount = 0;

      merged.lifts_detailed = merged.lifts_detailed.map(lift => {
        const key = `lift_${lift.name}`;
        if (overrideMap.has(key)) {
          const isOpen = overrideMap.get(key);
          if (isOpen) {
            manualLiftsOpenCount++;
            if (lift.type_code === 1 || lift.type_code === 2 || lift.type_code === 4) {
              manualCableCarOpenCount++;
            } else if (lift.type_code === 3 || lift.type_code === 5 || lift.type_code === 6 || lift.type_code === 7) {
              manualDragLiftOpenCount++;
            }
          }
          return { ...lift, status_code: isOpen ? 1 : 2 };
        }
        if (lift.status_code === 1) {
          manualLiftsOpenCount++;
          if (lift.type_code === 1 || lift.type_code === 2 || lift.type_code === 4) {
            manualCableCarOpenCount++;
          } else if (lift.type_code === 3 || lift.type_code === 5 || lift.type_code === 6 || lift.type_code === 7) {
            manualDragLiftOpenCount++;
          }
        }
        return lift;
      });

      merged.lifts_open_count = manualLiftsOpenCount;
      merged.cable_car_open_count = manualCableCarOpenCount;
      merged.drag_lift_open_count = manualDragLiftOpenCount;
    }
  }

  return merged;
}

/**
 * DB-first: Načte data z cache + aplikuje manuální přepisy z widget_settings a slopes_lifts_overrides
 * Vrací data ve formátu pro StatusImagePage, nebo null pokud cache není dostupná
 */
async function fetchStatusDataFromDB() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [cacheResult, widgetResult, overridesResult] = await Promise.all([
      supabase.from('holidayinfo_cache').select('*').eq('id', 'main').single(),
      supabase.from('widget_settings').select('*').order('sort_order'),
      supabase.from('slopes_lifts_overrides').select('*').order('type').order('name'),
    ]);

    if (cacheResult.error || !cacheResult.data) {
      console.error('[Status Image] DB cache not available:', cacheResult.error?.message);
      return null;
    }

    const cache = cacheResult.data;
    const widgets = widgetResult.data || [];
    const overrides = overridesResult.data || [];

    console.log(`[Status Image] DB-first: cache loaded, ${widgets.length} widgets, ${overrides.length} overrides`);

    // Merge manual overrides with cache data
    const merged = mergeDataSources(cache, widgets, overrides);

    // Map to StatusImageData format
    return {
      isOpen: merged.is_open || false,
      liftsOpen: merged.cable_car_open_count || 0,
      liftsTotal: merged.drag_lift_open_count || 0,
      slopesOpen: merged.slopes_open_count || 0,
      slopesTotal: merged.slopes_total_count || 0,
      temperature: merged.temperature ? `${merged.temperature}°C` : 'N/A',
      weather: merged.weather && merged.weather !== '-' ? merged.weather : '',
      snowHeight: merged.snow_height || 'N/A',
      snowType: merged.snow_type || '',
      operatingHours: merged.opertime || '',
    };
  } catch (e) {
    console.error('[Status Image] DB fetch failed:', e.message);
    return null;
  }
}

/**
 * Fallback: Získá aktuální data přímo z Holiday Info API
 */
async function fetchStatusDataFromAPI() {
  const response = await fetch(`${HOLIDAYINFO_API}?dc=${HOLIDAYINFO_DC}&localias=kohutka`);
  const xmlText = await response.text();

  const { DOMParser } = await import('@xmldom/xmldom');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Operation status
  const locInfoWinter = xmlDoc.getElementsByTagName('loc_info_winter')[0];
  const operationCode = parseInt(getXMLText(locInfoWinter, 'operation_code')) || 2;
  const isOpen = operationCode === 3 || operationCode === 4;

  // Count LANOVKY/VLEKY
  const lifts = xmlDoc.getElementsByTagName('lift');
  let cableCarOpen = 0;
  let dragLiftOpen = 0;

  for (let i = 0; i < lifts.length; i++) {
    const typeCode = parseInt(getXMLText(lifts[i], 'type_code'));
    const statusCode = parseInt(getXMLText(lifts[i], 'status_code'));
    const liftIsOpen = statusCode === 1 || statusCode === 3;

    if (typeCode === 1 || typeCode === 2 || typeCode === 4) {
      if (liftIsOpen) cableCarOpen++;
    } else if (typeCode === 3 || typeCode === 5 || typeCode === 6 || typeCode === 7) {
      if (liftIsOpen) dragLiftOpen++;
    }
  }

  const liftsOpen = cableCarOpen;
  const liftsTotal = dragLiftOpen;

  // Count slopes
  const slopes = xmlDoc.getElementsByTagName('slope');
  let slopesOpen = 0;
  const slopesTotal = slopes.length;
  for (let i = 0; i < slopes.length; i++) {
    const statusCode = parseInt(getXMLText(slopes[i], 'status_code'));
    if (statusCode === 2 || statusCode === 6) slopesOpen++;
  }

  // Temperature from camera
  const cams = xmlDoc.getElementsByTagName('cam');
  let temperature = '';
  for (let i = 0; i < cams.length; i++) {
    if (cams[i].getAttribute('id') === '2122') {
      const lastImage = cams[i].getElementsByTagName('last_image')[0];
      temperature = getXMLText(lastImage, 'temp');
      break;
    }
  }
  if (!temperature && cams.length > 0) {
    const lastImage = cams[0].getElementsByTagName('last_image')[0];
    temperature = getXMLText(lastImage, 'temp');
  }

  // Weather
  const weather = getXMLText(locInfoWinter, 'weather_0700_text');

  // Snow height
  const snowMin = getXMLText(locInfoWinter, 'snowheight_slopes_min');
  const snowMax = getXMLText(locInfoWinter, 'snowheight_slopes_max');
  let snowHeight = '';
  if (snowMin && snowMax) {
    snowHeight = `${snowMin}-${snowMax} cm`;
  } else if (snowMin || snowMax) {
    snowHeight = `${snowMin || snowMax} cm`;
  }

  // Snow type
  const snowType = getXMLText(locInfoWinter, 'snowtype_text')?.trim() || '';

  // Operating hours
  const opertime = getXMLText(locInfoWinter, 'opertime');
  const operatingHours = opertime !== '00:00-00:00' ? opertime : '';

  return {
    isOpen,
    liftsOpen,
    liftsTotal,
    slopesOpen,
    slopesTotal,
    temperature: temperature ? `${temperature}°C` : 'N/A',
    weather: weather && weather !== '-' ? weather : '',
    snowHeight: snowHeight || 'N/A',
    snowType,
    operatingHours,
  };
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let page = null;

  try {
    const width = parseInt(req.query.width) || DEFAULT_WIDTH;
    const height = parseInt(req.query.height) || DEFAULT_HEIGHT;

    // DB-first: cache + manual overrides, fallback na přímý API call
    let statusData = await fetchStatusDataFromDB();
    if (!statusData) {
      console.warn('[Status Image] Falling back to direct API call');
      statusData = await fetchStatusDataFromAPI();
    }

    // Build URL s query params
    // V produkci použij SITE_URL env variable, jinak localhost
    const baseUrl = process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const params = new URLSearchParams({
      isOpen: String(statusData.isOpen),
      temperature: statusData.temperature,
      weather: statusData.weather || '',
      liftsOpen: String(statusData.liftsOpen),
      liftsTotal: String(statusData.liftsTotal),
      slopesOpen: String(statusData.slopesOpen),
      slopesTotal: String(statusData.slopesTotal),
      snowHeight: statusData.snowHeight,
      snowType: statusData.snowType || '',
      operatingHours: statusData.operatingHours || '',
    });
    const pageUrl = `${baseUrl}/status-image-render?${params.toString()}`;

    // Get browser and create page
    const browser = await getBrowser();
    page = await browser.newPage();

    // Set viewport to exact dimensions
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });

    // Navigate to the render page
    await page.goto(pageUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for the container to be ready
    await page.waitForSelector('#status-image-container', { timeout: 10000 });

    // Small delay to ensure fonts and images are loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    // Take screenshot of the container
    const element = await page.$('#status-image-container');
    const pngBuffer = await element.screenshot({
      type: 'png',
      omitBackground: false,
    });

    // Close page (keep browser running)
    await page.close();
    page = null;

    // Return PNG
    const filename = `kohutka-status-${new Date().toISOString().split('T')[0]}.png`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.send(pngBuffer);

  } catch (error) {
    console.error('Status image generation error:', error);

    // Close page if error
    if (page) {
      try {
        await page.close();
      } catch {
        // ignore
      }
    }

    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

// Cleanup browser on process exit
process.on('exit', () => {
  if (browserInstance) {
    browserInstance.close().catch(() => {});
  }
});
