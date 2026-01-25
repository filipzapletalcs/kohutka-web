import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === DEBUG: Environment check at server startup ===
console.log('='.repeat(60));
console.log('[ENV DEBUG] Server starting - checking environment variables');
console.log('[ENV DEBUG] OPENAI_API_KEY:', process.env.OPENAI_API_KEY
  ? `SET (length: ${process.env.OPENAI_API_KEY.length}, starts: ${process.env.OPENAI_API_KEY.substring(0,10)}...)`
  : 'NOT SET');
console.log('[ENV DEBUG] All OPENAI vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
console.log('[ENV DEBUG] All KEY vars:', Object.keys(process.env).filter(k => k.includes('KEY')));
console.log('[ENV DEBUG] Total env vars count:', Object.keys(process.env).length);
console.log('='.repeat(60));

const app = express();
const PORT = process.env.PORT || 3000;

// Valid SPA routes (must match React Router routes in App.tsx)
const VALID_ROUTES = new Set([
  '/',
  '/kamery',
  '/cenik',
  '/kontakt',
  '/cookies',
  '/ochrana-udaju',
  '/debug',
  '/status-image-render',
  '/admin',
  '/admin/login',
  '/admin/cenik',
  '/admin/kamery',
  '/admin/widget',
  '/admin/sjezdovky',
  '/admin/autopost',
]);

// Legacy URLs from old site that should return 410 Gone
const LEGACY_PREFIXES = [
  '/aktuality',
  // Add more legacy prefixes here as needed
];

// Wrap everything in async IIFE to ensure correct order
(async () => {
  // FIRST: Global request logger - this MUST run before everything else
  app.use((req, res, next) => {
    console.log(`🌐 Incoming: ${req.method} ${req.path} (full: ${req.url})`);
    next();
  });

  // Middleware for JSON parsing
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Cache health check endpoint
  app.get('/health/cache', async (req, res) => {
    try {
      const response = await fetch(`http://localhost:${PORT}/api/pricing?category=status`);
      const cacheStatus = await response.json();

      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        cache: cacheStatus,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  // Load and register API routes dynamically
  const apiDir = path.join(__dirname, 'api');
  if (fs.existsSync(apiDir)) {
    const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));

    for (const file of apiFiles) {
      const routeName = file.replace('.js', '');
      const routePath = `/api/${routeName}`;

      try {
        const { default: handler } = await import(`./api/${file}`);

        app.all(routePath, async (req, res) => {
          console.log(`📥 API Request: ${req.method} ${req.url}`);
          try {
            // Create a Vercel-like Request object
            const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
            const request = {
              url: url.href,
              method: req.method,
              headers: req.headers,
              body: req.body,
              query: Object.fromEntries(url.searchParams),
            };

            // Create a Vercel-like Response object
            const response = {
              status: (code) => {
                res.status(code);
                return response;
              },
              json: (data) => {
                res.json(data);
                return response;
              },
              send: (data) => {
                res.send(data);
                return response;
              },
              setHeader: (name, value) => {
                res.setHeader(name, value);
                return response;
              },
            };

            await handler(request, response);
          } catch (error) {
            console.error(`Error in API route ${routePath}:`, error);
            res.status(500).json({ error: 'Internal Server Error' });
          }
        });

        console.log(`✓ Registered API route: ${routePath}`);
      } catch (error) {
        console.error(`✗ Failed to load API route ${file}:`, error.message);
      }
    }
  }

  // API endpoint to manually refresh autopost scheduler (called after settings save)
  // Must be registered BEFORE static file middleware and SPA fallback
  let updateScheduleRef = null;
  app.post('/api/refresh-autopost', async (req, res) => {
    console.log('[Autopost] Manual refresh triggered');
    try {
      if (updateScheduleRef) {
        await updateScheduleRef();
        res.json({ success: true, message: 'Scheduler refreshed' });
      } else {
        res.json({ success: true, message: 'Scheduler not yet initialized' });
      }
    } catch (error) {
      console.error('[Autopost] Manual refresh failed:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  console.log('\n📁 Registering static file middleware (AFTER API routes)...');

  // Serve static files from dist directory with proper cache headers
  app.use(
    express.static(path.join(__dirname, 'dist'), {
      setHeaders: (res, filePath) => {
        // Hashed build assets under /assets/ - cache aggressively (1 year)
        // These files have content hashes in filenames, so they're safe to cache forever
        // When content changes, the hash changes, so browsers fetch the new file
        if (filePath.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }

        // index.html - must revalidate to pick up new asset hashes after deploy
        // no-store forces browsers to always fetch fresh copy (stronger than no-cache)
        // Safari/iOS is notoriously bad at respecting no-cache alone
        // Remove ETag to prevent conditional caching that could bypass no-store
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.removeHeader('ETag');
          res.removeHeader('Last-Modified');
          return;
        }

        // Other static files (favicon, manifest, sitemap, robots.txt, etc.)
        // Cache for 1 hour - reasonable balance between performance and freshness
        res.setHeader('Cache-Control', 'public, max-age=3600');
      },
    })
  );

  // SPA fallback with proper HTTP status codes for SEO
  app.use((req, res, next) => {
    // Normalize path: remove trailing slash (except for root)
    const requestPath = req.path === '/' ? '/' : req.path.replace(/\/+$/, '');
    const indexHtml = path.join(__dirname, 'dist', 'index.html');

    // Missing static files (assets, images, etc.) - return simple 404, not index.html
    // This prevents browsers from trying to parse HTML as JS/CSS
    const staticExtensions = /\.(js|css|map|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|avif)$/i;
    if (staticExtensions.test(requestPath) || requestPath.startsWith('/assets/')) {
      console.log(`📦 Missing static file (404): ${req.method} ${req.url}`);
      res.status(404);
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      return res.send('Not Found');
    }

    // Check if it's a legacy URL (410 Gone)
    const isLegacy = LEGACY_PREFIXES.some(prefix => requestPath.startsWith(prefix));
    if (isLegacy) {
      console.log(`⛔ Legacy URL (410 Gone): ${req.method} ${req.url}`);
      res.status(410);
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.setHeader('Cache-Control', 'no-store');
      return res.sendFile(indexHtml, (err) => {
        if (err) next(err);
      });
    }

    // Check if it's a valid SPA route (200 OK)
    if (VALID_ROUTES.has(requestPath)) {
      console.log(`✅ Valid SPA route (200): ${req.method} ${req.url}`);
      // SPA routes must revalidate to pick up new asset hashes after deploy
      // Use aggressive no-store because Safari/iOS ignores weaker directives
      // Remove ETag/Last-Modified to prevent conditional caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.removeHeader('ETag');
      res.removeHeader('Last-Modified');
      return res.sendFile(indexHtml, (err) => {
        if (err) next(err);
      });
    }

    // Unknown route - return 404 Not Found
    console.log(`❌ Not found (404): ${req.method} ${req.url}`);
    res.status(404);
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(indexHtml, (err) => {
      if (err) next(err);
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  // ===== AUTO-POST SCHEDULER =====
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qtnchzadjrmgfvhfzpzh.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0bmNoemFkanJtZ2Z2aGZ6cHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzYyNDAsImV4cCI6MjA4MDQ1MjI0MH0.gaCkl1hs_RKpbtHbSOMGbkAa4dCPgh6erEq524lSDk0';

  let scheduledJobs = [];

  async function updateSchedule() {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: settings, error } = await supabase
        .from('autopost_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[Autopost] Failed to fetch settings:', error.message);
        return;
      }

      if (!settings) {
        console.log('[Autopost] No settings found');
        return;
      }

      // Clear existing jobs
      scheduledJobs.forEach((job) => job.stop());
      scheduledJobs = [];

      if (!settings.enabled || settings.schedule_type === 'disabled') {
        console.log('[Autopost] Disabled');
        return;
      }

      const { morning_time, caption_mode } = settings;

      // Parse times (format: "HH:MM")
      const [morningHour, morningMin] = morning_time.split(':').map(Number);

      // Morning post - předáváme celý settings objekt
      const morningCron = `${morningMin} ${morningHour} * * *`;
      const morningJob = cron.schedule(
        morningCron,
        () => {
          executeAutopost(settings);
        },
        { timezone: 'Europe/Prague' }
      );
      scheduledJobs.push(morningJob);
      console.log(`[Autopost] Scheduled morning post at ${morning_time} (cron: ${morningCron}), mode: ${caption_mode || 'custom'}${settings.camera_id ? `, camera: ${settings.camera_id}` : ''}`);

      // Note: twice_daily option has been removed
    } catch (error) {
      console.error('[Autopost] Scheduler error:', error.message);
    }
  }

  async function executeAutopost(settings) {
    const {
      custom_caption,
      hashtags,
      camera_id: cameraId,
      camera_image_url: cameraImageUrl,
      image_type: imageType,
      caption_mode,
      selected_template_id,
    } = settings;

    console.log(`[Autopost] Executing at ${new Date().toISOString()}, mode: ${caption_mode || 'custom'}${cameraId ? `, camera: ${cameraId}` : ''}, imageType: ${imageType || 'both'}`);

    let caption = custom_caption;

    try {
      // AI mode - vždy generovat nový popisek
      if (caption_mode === 'ai') {
        console.log('[Autopost] Generating AI caption...');
        try {
          const aiResponse = await fetch(`http://localhost:${PORT}/api/generate-caption`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          const aiResult = await aiResponse.json();
          if (aiResult.success && aiResult.caption) {
            caption = aiResult.caption;
            console.log('[Autopost] AI caption generated:', caption.substring(0, 50) + '...');
          } else {
            console.error('[Autopost] AI generation failed:', aiResult.error || 'No caption returned');
            console.log('[Autopost] Using fallback custom_caption');
          }
        } catch (aiError) {
          console.error('[Autopost] AI generation error:', aiError.message);
          console.log('[Autopost] Using fallback custom_caption');
        }
      }

      // Template mode - načíst šablonu z DB
      if (caption_mode === 'template' && selected_template_id) {
        console.log('[Autopost] Loading template:', selected_template_id);
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data: template, error } = await supabase
            .from('autopost_templates')
            .select('content')
            .eq('id', selected_template_id)
            .single();

          if (template && template.content) {
            caption = template.content;
            console.log('[Autopost] Template loaded, content:', caption.substring(0, 50) + '...');
          } else if (error) {
            console.error('[Autopost] Template load error:', error.message);
          }
        } catch (templateError) {
          console.error('[Autopost] Template fetch error:', templateError.message);
        }
      }

      // Odeslat příspěvek
      const response = await fetch(`http://localhost:${PORT}/api/facebook-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          hashtags,
          cameraId,
          cameraImageUrl,
          imageType,
        }),
      });
      const result = await response.json();
      if (result.success) {
        console.log(`[Autopost] Success! Post ID: ${result.postId}${result.isCarousel ? ' (carousel)' : ''}`);
      } else {
        console.error(`[Autopost] Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('[Autopost] Execution failed:', error.message);
    }
  }

  async function initAutopostScheduler() {
    console.log('[Autopost] Initializing scheduler...');
    // Store reference for API endpoint
    updateScheduleRef = updateSchedule;
    await updateSchedule();

    // Check for settings changes every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('[Autopost] Refreshing schedule from database...');
      await updateSchedule();
    });
  }

  // ===== HOLIDAY INFO BACKUP SCHEDULER =====
  async function initHolidayInfoBackup() {
    console.log('[HolidayInfo Backup] Initializing scheduler...');

    // Run backup every 20 minutes
    cron.schedule(
      '*/20 * * * *',
      async () => {
        console.log(`[HolidayInfo Backup] Starting backup at ${new Date().toISOString()}`);
        try {
          const response = await fetch(`http://localhost:${PORT}/api/holidayinfo-backup`);
          const result = await response.json();
          if (result.success) {
            console.log(`[HolidayInfo Backup] ${result.message}`);
          } else {
            console.error(`[HolidayInfo Backup] Failed: ${result.error}`);
          }
        } catch (error) {
          console.error('[HolidayInfo Backup] Error:', error.message);
        }
      },
      { timezone: 'Europe/Prague' }
    );

    // Run initial backup on startup
    console.log('[HolidayInfo Backup] Running initial backup...');
    try {
      const response = await fetch(`http://localhost:${PORT}/api/holidayinfo-backup`);
      const result = await response.json();
      if (result.success) {
        console.log(`[HolidayInfo Backup] Initial backup: ${result.message}`);
      } else {
        console.error(`[HolidayInfo Backup] Initial backup failed: ${result.error}`);
      }
    } catch (error) {
      console.error('[HolidayInfo Backup] Initial backup error:', error.message);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Server is running!
📍 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
    `);

    // Initialize schedulers after server starts
    setTimeout(() => {
      initAutopostScheduler();
      initHolidayInfoBackup();
    }, 2000);
  });
})();
