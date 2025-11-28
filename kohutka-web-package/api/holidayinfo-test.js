/**
 * Testovací endpoint pro zjištění podpory Holidayinfo kamer
 *
 * Vrací strukturovaná data o všech kamerách včetně toho,
 * co která kamera podporuje (image, video, panorama)
 */

const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';
const HOLIDAYINFO_API_URL = 'https://exports.holidayinfo.cz/xml_export.php';

export default async function handler(req, res) {
  try {
    // Fetch XML export
    const response = await fetch(
      `${HOLIDAYINFO_API_URL}?dc=${HOLIDAYINFO_DC}&localias=kohutka`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch Holidayinfo data',
        status: response.status
      });
    }

    const xmlText = await response.text();

    // Parse XML
    const { DOMParser } = await import('@xmldom/xmldom');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for errors
    const statusEl = xmlDoc.getElementsByTagName('status')[0];
    const status = statusEl?.textContent?.trim();

    if (status === 'err') {
      const errors = Array.from(xmlDoc.getElementsByTagName('err'))
        .map(el => el.textContent)
        .join(', ');
      return res.status(400).json({
        error: 'Holidayinfo API error',
        details: errors
      });
    }

    // Parse cameras
    const cameras = [];
    const camElements = xmlDoc.getElementsByTagName('cam');

    for (let i = 0; i < camElements.length; i++) {
      const camEl = camElements[i];
      const camId = camEl.getAttribute('id');
      const hasVideo = camEl.getAttribute('hasvideo') === '1';

      const nameEl = camEl.getElementsByTagName('name')[0];
      const sealevelEl = camEl.getElementsByTagName('sealevel')[0];
      const name = nameEl?.textContent?.trim() || '';
      const sealevel = sealevelEl?.textContent?.trim() || '';

      // Check for media elements
      const mediaEl = camEl.getElementsByTagName('media')[0];
      if (!mediaEl) continue;

      const lastImageEl = mediaEl.getElementsByTagName('last_image')[0];
      const lastVideoEl = mediaEl.getElementsByTagName('last_video')[0];
      const lastPanoImageEl = mediaEl.getElementsByTagName('last_panoimage')[0];
      const lastHotspotsEl = mediaEl.getElementsByTagName('last_hotspots')[0];

      // Gather feature support
      const features = {
        hasImage: !!lastImageEl,
        hasVideo: hasVideo && !!lastVideoEl,
        hasPanorama: !!lastPanoImageEl,
        hasHotspots: !!lastHotspotsEl,
      };

      // Get image datetime if available
      let lastUpdate = '';
      if (lastImageEl) {
        lastUpdate = lastImageEl.getAttribute('datetime') || '';
      }

      // Get video info if available
      let videoInfo = null;
      if (lastVideoEl) {
        const videoFiles = lastVideoEl.getElementsByTagName('videofile');
        const formats = [];
        for (let j = 0; j < videoFiles.length; j++) {
          const vf = videoFiles[j];
          formats.push({
            id: vf.getAttribute('id'),
            size: vf.getAttribute('size'),
            url: vf.textContent?.trim()
          });
        }
        videoInfo = {
          datetime: lastVideoEl.getAttribute('datetime') || '',
          formats
        };
      }

      cameras.push({
        id: camId,
        name,
        sealevel,
        lastUpdate,
        features,
        videoInfo,
        // Proxy URLs pro testování
        proxyUrls: {
          image: `/api/holidayinfo-image?camid=${camId}&cropaspect=16:9&outw=1280`,
          imagePreview: `/api/holidayinfo-image?camid=${camId}&cropaspect=16:9&outw=640`,
          video: features.hasVideo ? `/api/holidayinfo-video?camid=${camId}&size=full&ext=mp4` : null,
          panorama: features.hasPanorama ? `/api/holidayinfo-panorama?camid=${camId}&cropaspect=16:9&outw=1920` : null,
        }
      });
    }

    // Return summary
    res.status(200).json({
      totalCameras: cameras.length,
      summary: {
        withVideo: cameras.filter(c => c.features.hasVideo).length,
        withPanorama: cameras.filter(c => c.features.hasPanorama).length,
        withHotspots: cameras.filter(c => c.features.hasHotspots).length,
      },
      cameras
    });

  } catch (err) {
    console.error('holidayinfo-test error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}
