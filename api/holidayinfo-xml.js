/**
 * Proxy endpoint pro Holidayinfo XML API
 *
 * Obchází CORS problém - HolidayInfo server vrací duplikovaný
 * Access-Control-Allow-Origin header, který prohlížeče odmítají.
 *
 * Parametry:
 * - localias: alias lokace (default: 'kohutka')
 */

const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';
const HOLIDAYINFO_BASE_URL = 'https://exports.holidayinfo.cz';

export default async function handler(req, res) {
  const { localias = 'kohutka' } = req.query;

  // Sestavení URL pro Holidayinfo API
  const params = new URLSearchParams({
    dc: HOLIDAYINFO_DC,
    localias: Array.isArray(localias) ? localias[0] : localias,
  });

  const targetUrl = `${HOLIDAYINFO_BASE_URL}/xml_export.php?${params.toString()}`;

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    });

    if (!upstream.ok) {
      console.error(`Holidayinfo XML API error: ${upstream.status}`);
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const xmlText = await upstream.text();

    // Nastavení hlaviček
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60"); // 1 minuta cache

    res.send(xmlText);
  } catch (err) {
    console.error("holidayinfo-xml proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
}
