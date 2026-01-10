/**
 * API Endpoint pro automatické postování na Facebook
 *
 * POST /api/facebook-post
 * Body: {
 *   caption?: string,
 *   hashtags?: string,
 *   cameraId?: string,     // ID kamery pro přidání snímku (carousel)
 *   testMode?: boolean,    // jen vygeneruje obrázek, nepostuje
 *   draft?: boolean,       // vytvoří nepublikovaný příspěvek (draft)
 *   scheduledTime?: number // Unix timestamp pro naplánované publikování
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

  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.VITE_FACEBOOK_PAGE_ID || '385566021470850';

  if (!accessToken) {
    return res.status(500).json({
      error: 'Facebook access token not configured',
      hint: 'Set FACEBOOK_PAGE_ACCESS_TOKEN environment variable',
    });
  }

  try {
    const { caption, hashtags, cameraId, cameraImageUrl, testMode, draft, scheduledTime } = req.body || {};

    // Default caption and hashtags
    const defaultCaption =
      'Aktuální podmínky na SKI CENTRUM KOHÚTKA! Přijďte si zalyžovat do srdce Beskyd.';
    const defaultHashtags = '#kohutka #lyze #skiing #beskydy #zima #ski #sneh #hory';

    // Build full caption
    const fullCaption = [caption || defaultCaption, '', hashtags || defaultHashtags].join('\n');

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

    console.log(`[Facebook Post] Starting post process (mode: ${modeLabel}, camera: ${hasCamera ? cameraId : 'none'})...`);
    console.log(`[Facebook Post] Caption: ${fullCaption.substring(0, 50)}...`);

    // 1. Generate status image by calling internal API
    const PORT = process.env.PORT || 3000;
    const statusImageUrl = `http://localhost:${PORT}/api/status-image`;

    console.log(`[Facebook Post] Fetching status image from ${statusImageUrl}`);
    const statusImageResponse = await fetch(statusImageUrl);

    if (!statusImageResponse.ok) {
      throw new Error(`Failed to generate status image: ${statusImageResponse.status}`);
    }

    const statusImageBuffer = await statusImageResponse.arrayBuffer();
    const statusImageSize = statusImageBuffer.byteLength;
    console.log(`[Facebook Post] Status image generated: ${statusImageSize} bytes`);

    // 2. Fetch camera snapshot if cameraId is provided
    let cameraImageBuffer = null;
    let cameraImageSize = 0;

    if (hasCamera) {
      // Use provided cameraImageUrl if available, otherwise fall back to holidayinfo-image API
      let fetchUrl;
      if (cameraImageUrl) {
        // Direct URL provided - use it directly
        fetchUrl = cameraImageUrl;
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

      await logToHistory({
        platform: 'facebook',
        status: 'success',
        post_id: 'TEST_MODE',
        caption: fullCaption,
        error_message: null,
        data_snapshot: {
          testMode: true,
          statusImageSize,
          cameraImageSize: cameraImageSize || null,
          cameraId: hasCamera ? cameraId : null,
        },
      });

      return res.status(200).json({
        success: true,
        testMode: true,
        message: `Test successful - ${cameraImageBuffer ? '2 images' : '1 image'} generated, ready to post`,
        caption: fullCaption,
        statusImageSize,
        cameraImageSize: cameraImageSize || null,
      });
    }

    // 4. Post to Facebook
    console.log(`[Facebook Post] Uploading to Facebook page ${pageId} (${modeLabel})...`);

    let postId;

    if (cameraImageBuffer) {
      // CAROUSEL MODE: Upload both images as unpublished, then create feed post
      console.log(`[Facebook Post] Creating carousel with 2 images...`);

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
      // SINGLE IMAGE MODE: Direct photo upload (original logic)
      const formData = new FormData();
      formData.append('source', new Blob([statusImageBuffer], { type: 'image/png' }), 'kohutka-status.png');
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
          data_snapshot: { statusImageSize, fbError: fbData.error, mode: modeLabel },
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
    console.log(`[Facebook Post] Success! Post ID: ${postId} (${statusLabel})`);

    await logToHistory({
      platform: 'facebook',
      status: isDraft ? 'pending' : 'success',
      post_id: postId,
      caption: fullCaption,
      error_message: null,
      data_snapshot: {
        statusImageSize,
        cameraImageSize: cameraImageSize || null,
        cameraId: hasCamera ? cameraId : null,
        mode: statusLabel,
        isCarousel: !!cameraImageBuffer,
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
      isCarousel: !!cameraImageBuffer,
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
