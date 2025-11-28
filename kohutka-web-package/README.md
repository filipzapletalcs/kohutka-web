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
