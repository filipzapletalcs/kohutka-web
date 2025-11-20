/**
 * Simple Webhook Server for Git Auto-Deploy
 * Listens for GitHub/GitLab webhooks and triggers rebuild
 *
 * Usage: node webhook-server.js
 *
 * GitHub Webhook URL: http://your-server:9000/webhook
 * Secret: Set in .env as WEBHOOK_SECRET
 */

import express from 'express';
import { execSync } from 'child_process';
import crypto from 'crypto';

const app = express();
const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'change-me-in-production';
const REPO_PATH = process.env.REPO_PATH || '/app';

app.use(express.json());

// Verify GitHub webhook signature
function verifyGitHubSignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;

  const hash = 'sha256=' + crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash));
}

// Webhook endpoint
app.post('/webhook', (req, res) => {
  console.log('📨 Webhook received');

  // Verify signature (GitHub)
  if (req.headers['x-hub-signature-256']) {
    if (!verifyGitHubSignature(req)) {
      console.error('❌ Invalid signature');
      return res.status(401).send('Invalid signature');
    }
  }

  const event = req.headers['x-github-event'] || req.headers['x-gitlab-event'];
  console.log(`📝 Event: ${event}`);

  // Only handle push events
  if (event !== 'push' && event !== 'Push Hook') {
    console.log('ℹ️  Ignoring non-push event');
    return res.status(200).send('OK');
  }

  // Extract branch name
  const branch = req.body.ref?.split('/').pop() || 'main';
  console.log(`🌿 Branch: ${branch}`);

  // Only rebuild for main branch
  if (branch !== 'main' && branch !== 'master') {
    console.log('ℹ️  Ignoring non-main branch');
    return res.status(200).send('OK');
  }

  // Respond quickly to avoid timeout
  res.status(200).send('Deploying...');

  // Execute deployment in background
  console.log('🚀 Starting deployment...');

  try {
    // Pull latest changes
    console.log('📥 Pulling changes...');
    execSync(`cd ${REPO_PATH} && git pull origin ${branch}`, { stdio: 'inherit' });

    // Rebuild using docker-compose
    console.log('🏗️  Rebuilding services...');
    execSync(`cd ${REPO_PATH} && docker-compose -f docker-compose.prod.yml down`, { stdio: 'inherit' });
    execSync(`cd ${REPO_PATH} && docker-compose -f docker-compose.prod.yml build --no-cache`, { stdio: 'inherit' });
    execSync(`cd ${REPO_PATH} && docker-compose -f docker-compose.prod.yml up -d`, { stdio: 'inherit' });

    console.log('✅ Deployment completed!');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🎣 Webhook server running!
📍 URL: http://localhost:${PORT}/webhook
🔐 Secret: ${SECRET === 'change-me-in-production' ? '⚠️  DEFAULT (change it!)' : '✓ Custom'}
  `);
});
