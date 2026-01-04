/**
 * API Endpoint pro automatické postování na Facebook
 *
 * POST /api/facebook-post
 * Body: {
 *   caption?: string,
 *   hashtags?: string,
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
    const { caption, hashtags, testMode, draft, scheduledTime } = req.body || {};

    // Default caption and hashtags
    const defaultCaption =
      'Aktuální podmínky na SKI CENTRUM KOHÚTKA! Přijďte si zalyžovat do srdce Beskyd.';
    const defaultHashtags = '#kohutka #lyze #skiing #beskydy #zima #ski #sneh #hory';

    // Build full caption
    const fullCaption = [caption || defaultCaption, '', hashtags || defaultHashtags].join('\n');

    // Determine post mode
    // Note: "draft" mode now creates a scheduled post 15 min in future
    // because FB API's published=false creates Ad Posts, not real drafts
    const isDraft = draft === true;
    const isScheduled = scheduledTime && !isDraft;

    // For draft mode, schedule 2 days into the future
    let effectiveScheduledTime = scheduledTime;
    if (isDraft) {
      effectiveScheduledTime = Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60); // 2 days from now
    }

    const modeLabel = isDraft ? 'SCHEDULED_DRAFT' : isScheduled ? 'SCHEDULED' : 'PUBLISH';

    console.log(`[Facebook Post] Starting post process (mode: ${modeLabel})...`);
    console.log(`[Facebook Post] Caption: ${fullCaption.substring(0, 50)}...`);

    // 1. Generate status image by calling internal API
    const PORT = process.env.PORT || 3000;
    const imageUrl = `http://localhost:${PORT}/api/status-image`;

    console.log(`[Facebook Post] Fetching image from ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Failed to generate status image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const imageSize = imageBuffer.byteLength;
    console.log(`[Facebook Post] Image generated: ${imageSize} bytes`);

    // 2. If test mode, return without posting
    if (testMode) {
      console.log(`[Facebook Post] Test mode - not posting`);

      await logToHistory({
        platform: 'facebook',
        status: 'success',
        post_id: 'TEST_MODE',
        caption: fullCaption,
        error_message: null,
        data_snapshot: { testMode: true, imageSize },
      });

      return res.status(200).json({
        success: true,
        testMode: true,
        message: 'Test successful - image generated, ready to post',
        caption: fullCaption,
        imageSize,
      });
    }

    // 3. Upload photo to Facebook
    // Facebook requires multipart/form-data for photo uploads
    console.log(`[Facebook Post] Uploading to Facebook page ${pageId} (${modeLabel})...`);

    // Create FormData with the image
    const formData = new FormData();
    formData.append('source', new Blob([imageBuffer], { type: 'image/png' }), 'kohutka-status.png');
    formData.append('message', fullCaption);
    formData.append('access_token', accessToken);

    // Step 1: Upload photo as unpublished first
    formData.append('published', 'false');

    const uploadResponse = await fetch(`${GRAPH_API_BASE}/${pageId}/photos`, {
      method: 'POST',
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || uploadData.error) {
      throw new Error(uploadData.error?.message || 'Failed to upload photo');
    }

    const photoId = uploadData.id;
    console.log(`[Facebook Post] Photo uploaded with ID: ${photoId}`);

    // Step 2: Create feed post with the photo attached
    const feedFormData = new URLSearchParams();
    feedFormData.append('message', fullCaption);
    feedFormData.append('attached_media[0]', JSON.stringify({ media_fbid: photoId }));
    feedFormData.append('access_token', accessToken);

    // Draft mode - create scheduled post 2 days in future (appears in Scheduled section)
    if (isDraft) {
      feedFormData.append('scheduled_publish_time', String(effectiveScheduledTime));
      feedFormData.append('published', 'false');
      const scheduledDate = new Date(effectiveScheduledTime * 1000).toLocaleString('cs-CZ');
      console.log(`[Facebook Post] Creating as SCHEDULED DRAFT for: ${scheduledDate}`);
    }
    // Scheduled mode - schedule for specified future time
    else if (isScheduled) {
      feedFormData.append('scheduled_publish_time', String(scheduledTime));
      feedFormData.append('published', 'false');
      const scheduledDate = new Date(scheduledTime * 1000).toISOString();
      console.log(`[Facebook Post] Scheduling for: ${scheduledDate}`);
    }

    const fbResponse = await fetch(`${GRAPH_API_BASE}/${pageId}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: feedFormData.toString(),
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
        data_snapshot: { imageSize, fbError: fbData.error, mode: modeLabel },
      });

      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: fbData.error,
      });
    }

    // Success!
    const postId = fbData.post_id || fbData.id;
    const statusLabel = isDraft ? 'draft' : isScheduled ? 'scheduled' : 'published';
    console.log(`[Facebook Post] Success! Post ID: ${postId} (${statusLabel})`);

    await logToHistory({
      platform: 'facebook',
      status: isDraft ? 'pending' : 'success',
      post_id: postId,
      caption: fullCaption,
      error_message: null,
      data_snapshot: { imageSize, mode: statusLabel },
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
