#!/bin/bash

# Setup Script pro kolegu
# Tento skript připraví vše potřebné pro běh Kohútka Web s auto-update

set -e

echo "🚀 Kohútka Web - Setup Script"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Please create .env file with following content:"
    echo "---"
    cat .env.docker.example
    echo "---"
    echo ""
    read -p "Create .env now from example? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cp .env.docker.example .env
        echo "✅ Created .env file"
        echo "⚠️  IMPORTANT: Edit .env and set your values!"
        echo ""
        read -p "Press Enter to continue after editing .env..."
    else
        echo "❌ Cannot continue without .env file"
        exit 1
    fi
fi

# Check if WEBHOOK_SECRET is set
if ! grep -q "WEBHOOK_SECRET" .env; then
    echo "⚠️  WEBHOOK_SECRET not found in .env"
    read -p "Generate random webhook secret? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | base64)
        echo "" >> .env
        echo "# Webhook secret for GitHub/GitLab auto-deploy" >> .env
        echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> .env
        echo "✅ Generated and saved WEBHOOK_SECRET"
    fi
fi

echo ""
echo "📦 Building Docker images..."
docker-compose -f docker-compose.complete.yml build

echo ""
echo "🚀 Starting services..."
docker-compose -f docker-compose.complete.yml up -d

echo ""
echo "✅ Setup completed!"
echo ""
echo "📍 Services running:"
echo "   - Web: http://localhost:3000"
echo "   - Webhook: http://localhost:9000/webhook"
echo "   - Health: http://localhost:3000/health"
echo ""
echo "🎣 GitHub Webhook Setup:"
echo "   1. Go to: GitHub Repo → Settings → Webhooks → Add webhook"
echo "   2. Payload URL: http://YOUR-SERVER-IP:9000/webhook"
echo "   3. Content type: application/json"
echo "   4. Secret: (check .env file for WEBHOOK_SECRET)"
echo "   5. Events: Just the push event"
echo "   6. Active: ✓"
echo ""
echo "📊 View logs:"
echo "   docker-compose -f docker-compose.complete.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose -f docker-compose.complete.yml down"
echo ""
