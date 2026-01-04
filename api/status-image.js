/**
 * API Endpoint pro generování status obrázků pro sociální sítě
 * Používá Puppeteer pro screenshot React komponenty - 100% identické s admin náhledem
 *
 * GET /api/status-image
 * Query params:
 *   - format: 'png' (default)
 *   - width: number (default: 1080)
 *   - height: number (default: 1350)
 */

import puppeteer from 'puppeteer';

// Holiday Info API config
const HOLIDAYINFO_API = 'https://exports.holidayinfo.cz/xml_export.php';
const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';

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
 * Získá aktuální data z Holiday Info API
 */
async function fetchStatusData() {
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

  // Snow height
  const snowMin = getXMLText(locInfoWinter, 'snowheight_slopes_min');
  const snowMax = getXMLText(locInfoWinter, 'snowheight_slopes_max');
  let snowHeight = '';
  if (snowMin && snowMax) {
    snowHeight = `${snowMin}-${snowMax} cm`;
  } else if (snowMin || snowMax) {
    snowHeight = `${snowMin || snowMax} cm`;
  }

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
    snowHeight: snowHeight || 'N/A',
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

    // Fetch current data
    const statusData = await fetchStatusData();

    // Build URL s query params
    // V produkci použij SITE_URL env variable, jinak localhost
    const baseUrl = process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const params = new URLSearchParams({
      isOpen: String(statusData.isOpen),
      temperature: statusData.temperature,
      liftsOpen: String(statusData.liftsOpen),
      liftsTotal: String(statusData.liftsTotal),
      slopesOpen: String(statusData.slopesOpen),
      slopesTotal: String(statusData.slopesTotal),
      snowHeight: statusData.snowHeight,
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
