/**
 * API Endpoint pro generování status obrázků pro sociální sítě
 *
 * GET /api/status-image
 * Query params:
 *   - format: 'png' | 'svg' (default: 'png')
 *   - width: number (default: 1080 pro 4:5)
 *   - height: number (default: 1350 pro 4:5)
 */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  createStatusTemplate,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
} from '../src/templates/StatusImageTemplate.js';

// Holiday Info API config
const HOLIDAYINFO_API = 'https://exports.holidayinfo.cz/xml_export.php';
const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';

// Font cache
let fonts = null;

/**
 * Načte fonty pro Satori
 */
function loadFonts() {
  if (fonts) return fonts;

  const fontsDir = join(process.cwd(), 'public/fonts');

  try {
    fonts = [
      {
        name: 'Inter',
        data: readFileSync(join(fontsDir, 'Inter-Regular.ttf')),
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: readFileSync(join(fontsDir, 'Inter-Bold.ttf')),
        weight: 700,
        style: 'normal',
      },
      {
        name: 'Inter',
        data: readFileSync(join(fontsDir, 'Inter-Black.ttf')),
        weight: 900,
        style: 'normal',
      },
    ];
  } catch (error) {
    console.error('Failed to load fonts:', error);
    throw new Error('Fonts not found. Please ensure fonts are in public/fonts/');
  }

  return fonts;
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

  // Count LANOVKY/VLEKY - IDENTICAL to landing page widget format
  // Format: cableCarOpenCount/dragLiftOpenCount (e.g., 1/4)
  // Type codes: 1,2,4 = lanovky (sedačkové), 3,5,6,7 = vleky (včetně skiparku)
  const lifts = xmlDoc.getElementsByTagName('lift');
  let cableCarOpen = 0;  // lanovky otevřené
  let dragLiftOpen = 0;  // vleky otevřené (včetně skiparku)

  for (let i = 0; i < lifts.length; i++) {
    const typeCode = parseInt(getXMLText(lifts[i], 'type_code'));
    const statusCode = parseInt(getXMLText(lifts[i], 'status_code'));
    const isOpen = statusCode === 1 || statusCode === 3;

    // Lanovky (sedačkové, kabinkové): type 1, 2, 4
    if (typeCode === 1 || typeCode === 2 || typeCode === 4) {
      if (isOpen) cableCarOpen++;
    }
    // Vleky včetně skiparku: type 3, 5, 6, 7
    else if (typeCode === 3 || typeCode === 5 || typeCode === 6 || typeCode === 7) {
      if (isOpen) dragLiftOpen++;
    }
  }

  // liftsOpen = lanovky otevřené, liftsTotal = vleky otevřené (same as landing page)
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

  // Temperature from camera (prefer cam 2122 - Chata Kohútka panorama, same as landing page)
  const cams = xmlDoc.getElementsByTagName('cam');
  let temperature = '';
  for (let i = 0; i < cams.length; i++) {
    if (cams[i].getAttribute('id') === '2122') {
      const lastImage = cams[i].getElementsByTagName('last_image')[0];
      temperature = getXMLText(lastImage, 'temp');
      break;
    }
  }
  // Fallback to first camera if 2122 not found
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
    date: new Date().toLocaleDateString('cs-CZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
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

  try {
    // Parse query params (default 4:5 pro Facebook)
    const width = parseInt(req.query.width) || DEFAULT_WIDTH;
    const height = parseInt(req.query.height) || DEFAULT_HEIGHT;
    const format = req.query.format || 'png';

    // Load fonts
    const fontData = loadFonts();

    // Fetch current data
    const statusData = await fetchStatusData();

    // Create template
    const template = createStatusTemplate(statusData);

    // Generate SVG
    const svg = await satori(template, {
      width,
      height,
      fonts: fontData,
    });

    // Return SVG if requested
    if (format === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      return res.send(svg);
    }

    // Convert to PNG
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: width },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Return PNG
    const filename = `kohutka-status-${new Date().toISOString().split('T')[0]}.png`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    res.send(pngBuffer);

  } catch (error) {
    console.error('Status image generation error:', error);
    res.status(500).json({
      error: 'Failed to generate image',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
