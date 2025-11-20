/**
 * Proxy endpoint pro Holidayinfo panoramatické snímky
 *
 * Vrací panoramatický obrázek z kamery
 *
 * Parametry:
 * - camid: ID kamery (povinné)
 * - cropaspect: poměr stran, např. "16:9" (volitelné)
 * - outw: výstupní šířka v px (volitelné)
 * - outh: výstupní výška v px (volitelné)
 */

const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';
const HOLIDAYINFO_BASE_URL = 'https://exports.holidayinfo.cz';

export default async function handler(req, res) {
  const { camid, cropaspect, outw, outh } = req.query;

  // Validace povinného parametru
  if (!camid || Array.isArray(camid)) {
    res.status(400).json({ error: "Missing or invalid camid" });
    return;
  }

  // Sestavení URL pro Holidayinfo API
  const params = new URLSearchParams({
    dc: HOLIDAYINFO_DC,
    camid: camid,
  });

  // Přidání volitelných parametrů
  if (cropaspect && !Array.isArray(cropaspect)) {
    params.append('cropaspect', cropaspect);
  }
  if (outw && !Array.isArray(outw)) {
    params.append('outw', outw);
  }
  if (outh && !Array.isArray(outh)) {
    params.append('outh', outh);
  }

  const targetUrl = `${HOLIDAYINFO_BASE_URL}/loc_cams_lastpanoimage.php?${params.toString()}`;

  try {
    const upstream = await fetch(targetUrl);

    if (!upstream.ok) {
      console.error(`Holidayinfo panorama API error: ${upstream.status} for camid=${camid}`);
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";

    // Cache hlavičky - panoramy se mění každých ~5 minut
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 minut

    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("holidayinfo-panorama proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
}
