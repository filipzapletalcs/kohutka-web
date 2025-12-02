/**
 * HLS Proxy - obchází CORS pro HLS streamy
 *
 * Endpoint: /api/hls-proxy?url=<encoded_url>
 *
 * Proxuje M3U8 manifesty a TS segmenty z externích serverů
 * které nemají CORS hlavičky (např. streamer.i2net.cz)
 */

export default async function handler(req, res) {
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = url.searchParams.get('url');

  // CORS headers - povolíme všechny origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range');

  // Preflight request
  if (method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Dekóduj URL
    const decodedUrl = decodeURIComponent(targetUrl);

    // Validace - povolíme pouze streamy z i2net
    const urlObj = new URL(decodedUrl);
    const allowedHosts = ['streamer.i2net.cz'];

    if (!allowedHosts.includes(urlObj.hostname)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only i2net streams are allowed'
      });
    }

    // Fetch stream
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; KohutkaProxy/1.0)',
        ...(req.headers.range ? { 'Range': req.headers.range } : {}),
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Upstream error',
        status: response.status
      });
    }

    // Získej content type
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Nastav response headers
    res.setHeader('Content-Type', contentType);

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // Pro M3U8 soubory musíme přepsat URL segmentů
    if (contentType.includes('mpegurl') || decodedUrl.endsWith('.m3u8')) {
      const text = await response.text();

      // Přepiš relativní a absolutní URL v manifestu
      const baseUrl = decodedUrl.substring(0, decodedUrl.lastIndexOf('/') + 1);
      const proxyBaseUrl = `/api/hls-proxy?url=`;

      const rewrittenManifest = text.split('\n').map(line => {
        const trimmed = line.trim();

        // Přeskoč komentáře a prázdné řádky
        if (!trimmed || trimmed.startsWith('#')) {
          // Pokud je to URI v EXT-X-KEY nebo podobně, přepiš i to
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
              const fullUrl = uri.startsWith('http') ? uri : baseUrl + uri;
              return `URI="${proxyBaseUrl}${encodeURIComponent(fullUrl)}"`;
            });
          }
          return line;
        }

        // Přepiš URL segmentů
        const fullUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
        return proxyBaseUrl + encodeURIComponent(fullUrl);
      }).join('\n');

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.status(200).send(rewrittenManifest);
    }

    // Pro TS segmenty streamuj přímo
    const buffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));

  } catch (error) {
    console.error('[HLS Proxy] Error:', error);
    return res.status(500).json({
      error: 'Proxy error',
      message: error.message
    });
  }
}
