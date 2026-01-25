/**
 * API Endpoint pro automatické postování na Facebook
 *
 * POST /api/facebook-post
 * Body: {
 *   caption?: string,
 *   hashtags?: string,
 *   cameraId?: string,       // ID kamery pro přidání snímku
 *   cameraImageUrl?: string, // URL kamery (pokud není z Holiday Info)
 *   imageType?: 'widget_only' | 'camera_only' | 'both' | 'none', // typ obrázku
 *   testMode?: boolean,      // jen vygeneruje obrázek, nepostuje
 *   draft?: boolean,         // vytvoří nepublikovaný příspěvek (draft)
 *   scheduledTime?: number   // Unix timestamp pro naplánované publikování
 * }
 *
 * Requires: FACEBOOK_PAGE_ACCESS_TOKEN environment variable
 */

import { createClient } from '@supabase/supabase-js';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Supabase config
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtnchzadjrmgfvhfzpzh.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bmNoemFkanJtZ2Z2aGZ6cHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYyNDAsImV4cCI6MjA4MDQ1MjI0MH0.gaCkl1hs_RKpbtHbSOMGbkAa4dCPgh6erEq524lSDk0';

/**
 * Fetch holiday info data from cache
 */
async function fetchHolidayInfoFromCache() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('holidayinfo_cache')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) {
      console.error('[Facebook Post] Failed to fetch holiday info cache:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('[Facebook Post] Error fetching holiday info:', e);
    return null;
  }
}

/**
 * Replace placeholders in caption with actual values from holiday info
 */
function replacePlaceholders(caption, holidayInfo, cameraName = '') {
  if (!caption) return caption;

  const now = new Date();
  const dayNames = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];

  const replacements = {
    // Texty
    '{text_comment}': holidayInfo?.text_comment || '',
    '{desc_text}': holidayInfo?.desc_text || '',
    // Počasí
    '{teplota}': holidayInfo?.temperature ? `${holidayInfo.temperature}°C` : '',
    '{pocasi}': holidayInfo?.weather || '',
    // Sníh
    '{snih_vyska}': holidayInfo?.snow_height || '',
    '{snih_typ}': holidayInfo?.snow_type || '',
    '{novy_snih}': holidayInfo?.new_snow || '',
    // Provoz
    '{provozni_doba}': holidayInfo?.opertime || '',
    '{stav}': holidayInfo?.is_open ? 'Otevřeno' : 'Zavřeno',
    '{provozni_text}': holidayInfo?.operation_text || '',
    // Lanovky a vleky
    '{lanovky}': String(holidayInfo?.cable_car_open_count || 0),
    '{lanovky_celkem}': String(holidayInfo?.cable_car_total_count || 0),
    '{vleky}': String(holidayInfo?.drag_lift_open_count || 0),
    '{vleky_celkem}': String(holidayInfo?.drag_lift_total_count || 0),
    // Sjezdovky
    '{sjezdovky}': String(holidayInfo?.slopes_open_count || 0),
    '{sjezdovky_celkem}': String(holidayInfo?.slopes_total_count || 0),
    // Datum a čas
    '{datum}': now.toLocaleDateString('cs-CZ'),
    '{den}': dayNames[now.getDay()],
    // Kamera
    '{kamera}': cameraName || '',
  };

  let result = caption;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

/**
 * Get camera name from cameras_settings table
 */
async function getCameraName(cameraId) {
  if (!cameraId || cameraId === 'none') return '';

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from('cameras_settings')
      .select('custom_name')
      .eq('camera_id', cameraId)
      .single();

    if (error || !data) {
      console.log(`[Facebook Post] No custom camera name found for ${cameraId}`);
      return cameraId; // Fallback to camera ID
    }

    return data.custom_name || cameraId;
  } catch (err) {
    console.error('[Facebook Post] Error fetching camera name:', err);
    return cameraId;
  }
}

/**
 * Log to autopost_history table
 */
async function logToHistory(entry) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('autopost_history').insert({
      platform: entry.platform,
      status: entry.status,
      post_id: entry.post_id,
      caption: entry.caption,
      error_message: entry.error_message,
      data_snapshot: entry.data_snapshot,
    });
    if (error) {
      console.error('Failed to log to history:', error);
    }
  } catch (e) {
    console.error('Failed to log to history:', e);
  }
}

/**
 * Upload photo to Facebook as unpublished
 * Returns the photo ID for use in carousel
 */
async function uploadUnpublishedPhoto(pageId, accessToken, imageBuffer, filename) {
  const formData = new FormData();
  formData.append('source', new Blob([imageBuffer], { type: 'image/png' }), filename);
  formData.append('published', 'false');
  formData.append('access_token', accessToken);

  const response = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to upload photo');
  }

  return data.id;
}

/**
 * Create a carousel/multi-photo post on Facebook feed
 */
async function createCarouselPost(pageId, accessToken, photoIds, message, options = {}) {
  const { isDraft, isScheduled, scheduledTime } = options;

  const params = new URLSearchParams();
  params.append('message', message);
  params.append('access_token', accessToken);

  // Attach all photos
  photoIds.forEach((photoId, index) => {
    params.append(`attached_media[${index}]`, JSON.stringify({ media_fbid: photoId }));
  });

  // Handle draft/scheduled mode
  if (isDraft || isScheduled) {
    params.append('published', 'false');
    params.append('scheduled_publish_time', String(scheduledTime));
  }

  const response = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to create carousel post');
  }

  return data.id;
}

/**
 * Create a text-only post on Facebook feed (without images)
 */
async function createTextPost(pageId, accessToken, message, options = {}) {
  const { isDraft, isScheduled, scheduledTime } = options;

  const params = new URLSearchParams();
  params.append('message', message);
  params.append('access_token', accessToken);

  // Handle draft/scheduled mode
  if (isDraft || isScheduled) {
    params.append('published', 'false');
    params.append('scheduled_publish_time', String(scheduledTime));
  }

  const response = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to create text post');
  }

  return data.id;
}

/**
 * Main handler
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || process.env.VITE_FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.VITE_FACEBOOK_PAGE_ID || '385566021470850';

  if (!accessToken) {
    return res.status(500).json({
      error: 'Facebook access token not configured',
      hint: 'Set FACEBOOK_PAGE_ACCESS_TOKEN environment variable',
    });
  }

  try {
    const { caption, hashtags, cameraId, cameraImageUrl, imageType = 'both', testMode, draft, scheduledTime } = req.body || {};

    // Default caption and hashtags
    const defaultCaption =
      'Aktuální podmínky na SKI CENTRUM KOHÚTKA! Přijďte si zalyžovat do srdce Beskyd.';
    const defaultHashtags = '#kohutka #lyze #skiing #beskydy #zima #ski #sneh #hory';

    // Fetch holiday info for placeholder replacement
    const holidayInfo = await fetchHolidayInfoFromCache();

    // Fetch camera name for {kamera} placeholder
    const cameraName = await getCameraName(cameraId);

    // Build caption and replace placeholders with actual values
    let processedCaption = caption || defaultCaption;
    processedCaption = replacePlaceholders(processedCaption, holidayInfo, cameraName);
    console.log('[Facebook Post] Placeholders replaced with holiday info data');

    // Build full caption with hashtags
    const fullCaption = [processedCaption, '', hashtags || defaultHashtags].join('\n');

    // Determine post mode
    const isDraft = draft === true;
    const isScheduled = scheduledTime && !isDraft;

    // For draft mode, schedule 2 days into the future
    let effectiveScheduledTime = scheduledTime;
    if (isDraft) {
      effectiveScheduledTime = Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60; // 2 days from now
    }

    const modeLabel = isDraft ? 'SCHEDULED_DRAFT' : isScheduled ? 'SCHEDULED' : 'PUBLISH';
    const hasCamera = cameraId && cameraId !== 'none';

    // Determine what images to include based on imageType
    const includeWidget = imageType === 'widget_only' || imageType === 'both';
    const includeCamera = (imageType === 'camera_only' || imageType === 'both') && hasCamera;
    const isTextOnly = imageType === 'none';

    console.log(`[Facebook Post] Starting post process (mode: ${modeLabel}, imageType: ${imageType}, camera: ${hasCamera ? cameraId : 'none'})...`);
    console.log(`[Facebook Post] Caption: ${fullCaption.substring(0, 50)}...`);

    // 1. Generate status image if needed
    const PORT = process.env.PORT || 3000;
    let statusImageBuffer = null;
    let statusImageSize = 0;

    if (includeWidget) {
      const statusImageUrl = `http://localhost:${PORT}/api/status-image`;
      console.log(`[Facebook Post] Fetching status image from ${statusImageUrl}`);
      const statusImageResponse = await fetch(statusImageUrl);

      if (!statusImageResponse.ok) {
        throw new Error(`Failed to generate status image: ${statusImageResponse.status}`);
      }

      statusImageBuffer = await statusImageResponse.arrayBuffer();
      statusImageSize = statusImageBuffer.byteLength;
      console.log(`[Facebook Post] Status image generated: ${statusImageSize} bytes`);
    }

    // 2. Fetch camera snapshot if needed
    let cameraImageBuffer = null;
    let cameraImageSize = 0;

    if (includeCamera) {
      // Use provided cameraImageUrl if available, otherwise fall back to holidayinfo-image API
      let fetchUrl;
      if (cameraImageUrl) {
        // Pokud je URL relativní, přidat base URL
        if (cameraImageUrl.startsWith('/')) {
          const baseUrl = process.env.SITE_URL || `http://localhost:${PORT}`;
          fetchUrl = `${baseUrl}${cameraImageUrl}`;
        } else {
          fetchUrl = cameraImageUrl;
        }
      } else {
        // Fall back to holidayinfo-image API (only works for HolidayInfo cameras)
        fetchUrl = `http://localhost:${PORT}/api/holidayinfo-image?camid=${cameraId}`;
      }
      console.log(`[Facebook Post] Fetching camera image from ${fetchUrl}`);

      const cameraImageResponse = await fetch(fetchUrl);

      if (!cameraImageResponse.ok) {
        console.warn(`[Facebook Post] Failed to fetch camera image: ${cameraImageResponse.status}, continuing without it`);
      } else {
        cameraImageBuffer = await cameraImageResponse.arrayBuffer();
        cameraImageSize = cameraImageBuffer.byteLength;
        console.log(`[Facebook Post] Camera image fetched: ${cameraImageSize} bytes`);
      }
    }

    // 3. If test mode, return without posting
    if (testMode) {
      console.log(`[Facebook Post] Test mode - not posting`);

      const imageCount = (statusImageBuffer ? 1 : 0) + (cameraImageBuffer ? 1 : 0);
      const imageTypeLabel = isTextOnly ? 'text only' : `${imageCount} image(s)`;

      await logToHistory({
        platform: 'facebook',
        status: 'success',
        post_id: 'TEST_MODE',
        caption: fullCaption,
        error_message: null,
        data_snapshot: {
          testMode: true,
          imageType,
          statusImageSize: statusImageSize || null,
          cameraImageSize: cameraImageSize || null,
          cameraId: hasCamera ? cameraId : null,
        },
      });

      return res.status(200).json({
        success: true,
        testMode: true,
        message: `Test successful - ${imageTypeLabel} generated, ready to post`,
        caption: fullCaption,
        imageType,
        statusImageSize: statusImageSize || null,
        cameraImageSize: cameraImageSize || null,
      });
    }

    // 4. Post to Facebook
    console.log(`[Facebook Post] Uploading to Facebook page ${pageId} (${modeLabel}, imageType: ${imageType})...`);

    let postId;
    let isCarousel = false;

    if (isTextOnly) {
      // TEXT-ONLY MODE: Post without images
      console.log(`[Facebook Post] Creating text-only post...`);

      postId = await createTextPost(
        pageId,
        accessToken,
        fullCaption,
        {
          isDraft,
          isScheduled,
          scheduledTime: effectiveScheduledTime,
        }
      );
      console.log(`[Facebook Post] Text post created: ${postId}`);
    } else if (statusImageBuffer && cameraImageBuffer) {
      // CAROUSEL MODE: Upload both images as unpublished, then create feed post
      console.log(`[Facebook Post] Creating carousel with 2 images...`);
      isCarousel = true;

      // Upload status image
      const statusPhotoId = await uploadUnpublishedPhoto(
        pageId,
        accessToken,
        statusImageBuffer,
        'kohutka-status.png'
      );
      console.log(`[Facebook Post] Status photo uploaded: ${statusPhotoId}`);

      // Upload camera image
      const cameraPhotoId = await uploadUnpublishedPhoto(
        pageId,
        accessToken,
        cameraImageBuffer,
        'kohutka-camera.jpg'
      );
      console.log(`[Facebook Post] Camera photo uploaded: ${cameraPhotoId}`);

      // Create carousel post
      postId = await createCarouselPost(
        pageId,
        accessToken,
        [statusPhotoId, cameraPhotoId],
        fullCaption,
        {
          isDraft,
          isScheduled,
          scheduledTime: effectiveScheduledTime,
        }
      );
      console.log(`[Facebook Post] Carousel post created: ${postId}`);
    } else {
      // SINGLE IMAGE MODE: Direct photo upload
      const imageBuffer = statusImageBuffer || cameraImageBuffer;
      const imageFilename = statusImageBuffer ? 'kohutka-status.png' : 'kohutka-camera.jpg';
      const imageType_internal = statusImageBuffer ? 'image/png' : 'image/jpeg';

      if (!imageBuffer) {
        throw new Error('No image available to post');
      }

      console.log(`[Facebook Post] Creating single image post (${imageFilename})...`);

      const formData = new FormData();
      formData.append('source', new Blob([imageBuffer], { type: imageType_internal }), imageFilename);
      formData.append('message', fullCaption);
      formData.append('access_token', accessToken);

      if (isDraft) {
        formData.append('published', 'false');
        formData.append('scheduled_publish_time', String(effectiveScheduledTime));
        const scheduledDate = new Date(effectiveScheduledTime * 1000).toLocaleString('cs-CZ');
        console.log(`[Facebook Post] Creating as SCHEDULED DRAFT for: ${scheduledDate}`);
      } else if (isScheduled) {
        formData.append('published', 'false');
        formData.append('scheduled_publish_time', String(scheduledTime));
        const scheduledDate = new Date(scheduledTime * 1000).toISOString();
        console.log(`[Facebook Post] Scheduling for: ${scheduledDate}`);
      } else {
        formData.append('published', 'true');
        console.log(`[Facebook Post] Publishing immediately with published=true`);
      }

      const fbResponse = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
        method: 'POST',
        body: formData,
      });

      const fbData = await fbResponse.json();

      if (!fbResponse.ok || fbData.error) {
        const errorMessage = fbData.error?.message || 'Unknown Facebook API error';
        console.error(`[Facebook Post] Error: ${errorMessage}`);

        await logToHistory({
          platform: 'facebook',
          status: 'failed',
          post_id: null,
          caption: fullCaption,
          error_message: errorMessage,
          data_snapshot: { imageType, statusImageSize, cameraImageSize, fbError: fbData.error, mode: modeLabel },
        });

        return res.status(500).json({
          success: false,
          error: errorMessage,
          details: fbData.error,
        });
      }

      postId = fbData.post_id || fbData.id;
    }

    // Success!
    const statusLabel = isDraft ? 'draft' : isScheduled ? 'scheduled' : 'published';
    console.log(`[Facebook Post] Success! Post ID: ${postId} (${statusLabel}, imageType: ${imageType})`);

    await logToHistory({
      platform: 'facebook',
      status: isDraft ? 'pending' : 'success',
      post_id: postId,
      caption: fullCaption,
      error_message: null,
      data_snapshot: {
        imageType,
        statusImageSize: statusImageSize || null,
        cameraImageSize: cameraImageSize || null,
        cameraId: hasCamera ? cameraId : null,
        mode: statusLabel,
        isCarousel,
        isTextOnly,
      },
    });

    // Build success message based on mode
    let message = 'Posted successfully to Facebook';
    if (isDraft) {
      const scheduledDate = new Date(effectiveScheduledTime * 1000).toLocaleString('cs-CZ');
      message = `Příspěvek naplánován na ${scheduledDate}. Najdeš ho v Meta Business Suite → Scheduled, kde ho můžeš publikovat ihned nebo upravit.`;
    } else if (isScheduled) {
      const scheduledDate = new Date(scheduledTime * 1000).toLocaleString('cs-CZ');
      message = `Post scheduled for ${scheduledDate}`;
    }

    return res.status(200).json({
      success: true,
      postId,
      mode: statusLabel,
      message,
      imageType,
      isCarousel,
      isTextOnly,
    });
  } catch (error) {
    console.error(`[Facebook Post] Exception: ${error.message}`);

    await logToHistory({
      platform: 'facebook',
      status: 'failed',
      post_id: null,
      caption: null,
      error_message: error.message,
      data_snapshot: null,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
