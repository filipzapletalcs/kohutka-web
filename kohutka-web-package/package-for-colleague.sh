#!/bin/bash

# Package Script - Vytvoří kompletní balíček pro kolegu
# Zahrnuje vše potřebné kromě .env (ten se posílá separátně)

set -e

echo "📦 Packaging Kohútka Web for colleague..."
echo ""

PACKAGE_NAME="kohutka-web-package"
PACKAGE_DIR="./${PACKAGE_NAME}"
ARCHIVE_NAME="${PACKAGE_NAME}.tar.gz"

# Vyčištění starého balíčku
if [ -d "$PACKAGE_DIR" ]; then
    rm -rf "$PACKAGE_DIR"
fi

if [ -f "$ARCHIVE_NAME" ]; then
    rm "$ARCHIVE_NAME"
fi

# Vytvoření adresáře balíčku
mkdir -p "$PACKAGE_DIR"

echo "📋 Copying files..."

# Zkopírování důležitých souborů
cp -r src "$PACKAGE_DIR/"
cp -r public "$PACKAGE_DIR/"
cp -r api "$PACKAGE_DIR/"
cp package*.json "$PACKAGE_DIR/"
cp *.md "$PACKAGE_DIR/" 2>/dev/null || true
cp index.html "$PACKAGE_DIR/"
cp vite.config.ts "$PACKAGE_DIR/"
cp tailwind.config.ts "$PACKAGE_DIR/"
cp tsconfig*.json "$PACKAGE_DIR/"
cp postcss.config.js "$PACKAGE_DIR/"
cp components.json "$PACKAGE_DIR/" 2>/dev/null || true

# Docker soubory
cp Dockerfile "$PACKAGE_DIR/"
cp Dockerfile.dev "$PACKAGE_DIR/"
cp Dockerfile.webhook "$PACKAGE_DIR/"
cp .dockerignore "$PACKAGE_DIR/"
cp docker-compose*.yml "$PACKAGE_DIR/"
cp server.js "$PACKAGE_DIR/"
cp webhook-server.js "$PACKAGE_DIR/"

# Scripty
cp *.sh "$PACKAGE_DIR/"
chmod +x "$PACKAGE_DIR"/*.sh

# Environment example (NE .env!)
cp .env.docker.example "$PACKAGE_DIR/"

# GitHub workflows
if [ -d ".github" ]; then
    cp -r .github "$PACKAGE_DIR/"
fi

# README pro kolegu
cat > "$PACKAGE_DIR/README.md" << 'EOF'
# Kohútka Web - Kompletní Balíček

## 🚀 Rychlý Start

1. **Rozbalte a připravte:**
   ```bash
   tar -xzf kohutka-web-package.tar.gz
   cd kohutka-web-package
   ```

2. **Vytvořte .env soubor** (obdržíte separátně):
   ```bash
   cp .env.docker.example .env
   # Upravte .env a nastavte HOLIDAYINFO_DC a WEBHOOK_SECRET
   ```

3. **Spusťte setup:**
   ```bash
   chmod +x setup-for-colleague.sh
   ./setup-for-colleague.sh
   ```

4. **Otevřete v prohlížeči:**
   http://localhost:3000

## 📖 Dokumentace

- **SETUP-FOR-COLLEAGUE.md** - Detailní setup guide
- **DOCKER.md** - Docker dokumentace
- **GIT-AUTO-UPDATE.md** - Auto-update konfigurace

## 🎣 Auto-Update (Webhook)

Pro automatickou aktualizaci při push do GitHub:
- Nastavte webhook v GitHub repo
- URL: `http://YOUR-SERVER:9000/webhook`
- Secret: hodnota z `.env`
- Detaily v: SETUP-FOR-COLLEAGUE.md

---
EOF

echo "📦 Creating archive..."
tar -czf "$ARCHIVE_NAME" "$PACKAGE_DIR"

# Velikost
SIZE=$(du -h "$ARCHIVE_NAME" | cut -f1)

echo ""
echo "✅ Package created successfully!"
echo ""
echo "📦 Archive: $ARCHIVE_NAME"
echo "📊 Size: $SIZE"
echo ""
echo "📤 Co poslat kolegovi:"
echo "   1. $ARCHIVE_NAME"
echo "   2. .env (vytvořte separátně s credentials)"
echo ""
echo "📧 Příklad .env souboru pro kolegu:"
echo "---"
cat .env.docker.example
echo "---"
echo ""
echo "⚠️  DŮLEŽITÉ: NIKDY neposílejte .env ve stejném balíčku!"
echo "   - Pošlete .env separátně (email, secure chat, atd.)"
echo "   - Nebo nechte kolegu vytvořit vlastní .env"
echo ""
echo "🧹 Vyčistit dočasné soubory:"
echo "   rm -rf $PACKAGE_DIR"
echo ""
