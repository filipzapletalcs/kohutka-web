import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for JSON parsing
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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
        try {
          // Create a Vercel-like Request object
          const url = new URL(req.url, `http://${req.headers.host}`);
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

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback - serve index.html for all other routes
app.use((req, res, next) => {
  // If we get here, it means the route wasn't handled by API or static files
  // This is for React Router - serve index.html
  res.sendFile(path.join(__dirname, 'dist', 'index.html'), (err) => {
    if (err) {
      next(err);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Server is running!
📍 URL: http://localhost:${PORT}
🏥 Health: http://localhost:${PORT}/health
  `);
});
