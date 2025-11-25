# Kohútka Web - Setup Guide pro Kolegu

Tento balíček obsahuje kompletní Docker setup s automatickou aktualizací z Git repository.

## 📦 Co je v balíčku

- ✅ Docker kontejner s webovou aplikací
- ✅ Automatická aktualizace při push do Git repo (GitHub webhook)
- ✅ Health monitoring
- ✅ Production-ready konfigurace

## 🚀 Rychlý Start

### Krok 1: Příprava

```bash
# Rozbalte obdržené soubory
unzip kohutka-web.zip
cd kohutka-web

# Nebo pokud máte Git repo
git clone <your-repo-url>
cd kohutka-web
```

### Krok 2: Konfigurace .env

**DŮLEŽITÉ:** Vytvořte `.env` soubor (obdržíte separátně):

```bash
# Zkopírujte vzorový soubor
cp .env.docker.example .env

# Upravte .env a nastavte:
nano .env
```

Minimální obsah `.env`:
```bash
HOLIDAYINFO_DC=c9ixxlejab5d4mrr
WEBHOOK_SECRET=your-super-secret-webhook-key
NODE_ENV=production
```

### Krok 3: Spuštění

```bash
# Automatický setup (doporučeno)
chmod +x setup-for-colleague.sh
./setup-for-colleague.sh

# Nebo manuálně
docker-compose -f docker-compose.complete.yml up -d
```

### Krok 4: Ověření

```bash
# Otevřete v prohlížeči
open http://localhost:3000

# Zkontrolujte health
curl http://localhost:3000/health

# Zkontrolujte logy
docker-compose -f docker-compose.complete.yml logs -f
```

## 🎣 Nastavení GitHub Webhook (Auto-Update)

Pro automatickou aktualizaci při každém push do GitHub:

### 1. Zjistěte vaši veřejnou IP/doménu
```bash
curl ifconfig.me
# Nebo použijte vaši doménu: example.com
```

### 2. Nastavte GitHub Webhook

1. Jděte na: **GitHub Repo → Settings → Webhooks → Add webhook**
2. Vyplňte:
   - **Payload URL:** `http://YOUR-SERVER-IP:9000/webhook`
   - **Content type:** `application/json`
   - **Secret:** (použijte hodnotu `WEBHOOK_SECRET` z `.env`)
   - **Which events:** `Just the push event`
   - **Active:** ✓
3. Klikněte: **Add webhook**

### 3. Test

```bash
# Pushněte změnu do Git repo
git commit -m "test" --allow-empty
git push

# Sledujte logy webhook serveru
docker logs -f kohutka-webhook

# Měli byste vidět:
# 📨 Webhook received
# 🌿 Branch: main
# 📥 Pulling changes...
# 🏗️  Rebuilding services...
# ✅ Deployment completed!
```

## 🔧 Správa

### Zobrazit logy
```bash
# Všechny služby
docker-compose -f docker-compose.complete.yml logs -f

# Pouze web aplikace
docker logs -f kohutka-web

# Pouze webhook server
docker logs -f kohutka-webhook
```

### Restartovat služby
```bash
docker-compose -f docker-compose.complete.yml restart
```

### Zastavit služby
```bash
docker-compose -f docker-compose.complete.yml down
```

### Aktualizovat manuálně
```bash
git pull
docker-compose -f docker-compose.complete.yml down
docker-compose -f docker-compose.complete.yml build --no-cache
docker-compose -f docker-compose.complete.yml up -d
```

### Zobrazit running kontejnery
```bash
docker-compose -f docker-compose.complete.yml ps
```

## 🌐 Přístup přes internet

### Varianta A: Veřejná IP + Port Forwarding

1. Otevřete port 3000 (web) a 9000 (webhook) na routeru
2. GitHub webhook URL: `http://YOUR-PUBLIC-IP:9000/webhook`

### Varianta B: Nginx Reverse Proxy (doporučeno pro production)

```nginx
# /etc/nginx/sites-available/kohutka
server {
    listen 80;
    server_name kohutka.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /webhook {
        proxy_pass http://localhost:9000/webhook;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/kohutka /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Varianta C: ngrok (pro testování)

```bash
# Instalace ngrok
brew install ngrok  # macOS
# nebo stáhněte z https://ngrok.com

# Expose webhook
ngrok http 9000

# Použijte ngrok URL v GitHub webhook
# např: https://abc123.ngrok.io/webhook
```

## 🔐 Bezpečnost

### Doporučení:

1. ✅ **Silný WEBHOOK_SECRET** v `.env`
2. ✅ **Firewall** - otevřete pouze porty 3000 a 9000
3. ✅ **HTTPS** - použijte SSL/TLS (Let's Encrypt)
4. ✅ **Omezit GitHub webhook IP** - viz [GitHub Meta API](https://api.github.com/meta)

### Firewall (UFW)
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 9000/tcp
sudo ufw enable
```

## 🐛 Troubleshooting

### Port 3000 nebo 9000 už je používán

```bash
# Změňte porty v docker-compose.complete.yml
# Sekce kohutka-web:
    ports:
      - "8080:3000"  # Změňte 3000 na 8080

# Sekce webhook:
    ports:
      - "9001:9000"  # Změňte 9000 na 9001
```

### Webhook nefunguje

```bash
# 1. Zkontrolujte, že webhook server běží
curl http://localhost:9000/health

# 2. Zkontrolujte logy
docker logs -f kohutka-webhook

# 3. Test webhook manuálně
curl -X POST http://localhost:9000/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main"}'
```

### Kontejnery se nespustí

```bash
# Zkontrolujte logy
docker-compose -f docker-compose.complete.yml logs

# Zkontrolujte .env
cat .env

# Rebuild bez cache
docker-compose -f docker-compose.complete.yml build --no-cache
```

### Permission denied při git pull

```bash
# Nastavte Git credentials v kontejneru
docker exec -it kohutka-webhook git config --global credential.helper store
docker exec -it kohutka-webhook git pull  # Zadejte credentials
```

## 📊 Monitoring

### Health Check

```bash
# Aplikace
curl http://localhost:3000/health
# Očekávaný výstup: {"status":"ok","timestamp":"..."}

# Webhook
curl http://localhost:9000/health
# Očekávaný výstup: {"status":"ok","timestamp":"..."}
```

### Docker Stats

```bash
docker stats kohutka-web kohutka-webhook
```

## 🔄 Alternativa: Polling (bez webhooks)

Pokud nemůžete použít webhooks:

```bash
# Spusťte polling script místo webhook serveru
./git-auto-update-compose.sh

# Nebo jako systemd service
sudo cp kohutka-auto-update.service /etc/systemd/system/
sudo systemctl enable kohutka-auto-update
sudo systemctl start kohutka-auto-update
```

## 📞 Kontakt

Pokud máte problémy nebo otázky, kontaktujte poskytovatele balíčku.

## 📚 Další dokumentace

- [DOCKER.md](DOCKER.md) - Základní Docker dokumentace
- [GIT-AUTO-UPDATE.md](GIT-AUTO-UPDATE.md) - Detaily o auto-update variantách

---

**Vytvořeno s ❤️ pomocí Claude Code**
