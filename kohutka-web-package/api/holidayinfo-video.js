/**
 * Proxy endpoint pro Holidayinfo video file API
 *
 * Vrací přímý video soubor (MP4) pro použití v HTML5 <video> tagu
 *
 * Parametry:
 * - camid: ID kamery (povinné)
 * - size: velikost videa, např. "512x288" nebo "full" (volitelné, default: "512x288")
 * - ext: formát, např. "mp4" (volitelné, default: "mp4")
 */

const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';
const HOLIDAYINFO_BASE_URL = 'https://exports.holidayinfo.cz';

export default async function handler(req, res) {
  const { camid, size = '512x288', ext = 'mp4' } = req.query;

  // Validace povinného parametru
  if (!camid || Array.isArray(camid)) {
    res.status(400).json({ error: "Missing or invalid camid" });
    return;
  }

  // Sestavení URL pro Holidayinfo API
  const params = new URLSearchParams({
    dc: HOLIDAYINFO_DC,
    camid: camid,
    size: Array.isArray(size) ? size[0] : size,
    ext: Array.isArray(ext) ? ext[0] : ext,
  });

  const targetUrl = `${HOLIDAYINFO_BASE_URL}/loc_cams_expvideo_lastvideofile.php?${params.toString()}`;

  try {
    const upstream = await fetch(targetUrl);

    if (!upstream.ok) {
      console.error(`Holidayinfo video API error: ${upstream.status} for camid=${camid}`);
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const contentType = upstream.headers.get("content-type") || "video/mp4";

    // Cache hlavičky - videa se mění každých ~5 minut
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=300"); // 5 minut

    // Pro velké soubory je lepší streamovat
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("holidayinfo-video proxy error:", err);
    res.status(500).json({ error: "Proxy error" });
  }
}
