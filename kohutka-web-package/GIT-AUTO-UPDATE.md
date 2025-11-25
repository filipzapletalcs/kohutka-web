# Git Auto-Update Guide

Tento dokument popisuje různé způsoby, jak automaticky aktualizovat Docker kontejner při změnách v Git repository.

## 🎯 Varianty

### 1. Development Mode (Hot Reload)
**Použití:** Lokální vývoj
**Výhody:** Okamžité změny bez rebuildu
**Nevýhody:** Pouze pro development

### 2. Auto-Update Script
**Použití:** Production server s Git repo
**Výhody:** Jednoduchý, žádné dependencies
**Nevýhody:** Polling (kontrola každých X sekund)

### 3. Webhook Server
**Použití:** Production s GitHub/GitLab webhooks
**Výhody:** Okamžitá aktualizace po push
**Nevýhody:** Vyžaduje veřejnou IP nebo tunel

### 4. CI/CD (GitHub Actions)
**Použití:** Profesionální deployment
**Výhody:** Testování, automatizace, škálovatelné
**Nevýhody:** Složitější setup

---

## 1️⃣ Development Mode (Hot Reload)

### Setup

```bash
# Spuštění development režimu
docker-compose -f docker-compose.dev.yml up
```

### Co se děje
- Source kód je namountovaný jako volume
- Vite dev server sleduje změny
- Změny se projeví okamžitě (hot reload)
- Port: **8080**

### Použití
```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Logy
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

---

## 2️⃣ Auto-Update Script (Polling)

### Setup

```bash
# Upravte cestu k repo v skriptu
vim git-auto-update-compose.sh

# Nastavte executable permission
chmod +x git-auto-update-compose.sh

# Spuštění
./git-auto-update-compose.sh
```

### Co se děje
1. Každých 60 sekund kontroluje git repo
2. Pokud najde změny, provede `git pull`
3. Rebuilds Docker image
4. Restartuje kontejner

### Spuštění na pozadí (systemd)

Vytvořte systemd service:

```bash
sudo vim /etc/systemd/system/kohutka-auto-update.service
```

```ini
[Unit]
Description=Kohutka Web Auto-Update Service
After=docker.service
Requires=docker.service

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/kohutka-web
ExecStart=/path/to/kohutka-web/git-auto-update-compose.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable a start
sudo systemctl enable kohutka-auto-update
sudo systemctl start kohutka-auto-update

# Status
sudo systemctl status kohutka-auto-update

# Logy
sudo journalctl -u kohutka-auto-update -f
```

---

## 3️⃣ Webhook Server (GitHub/GitLab)

### Setup

1. **Instalace dependencies**
```bash
npm install express
```

2. **Vytvoření .env**
```bash
cat >> .env << EOF
WEBHOOK_SECRET=your-super-secret-key-here
WEBHOOK_PORT=9000
REPO_PATH=$(pwd)
EOF
```

3. **Spuštění webhook serveru**
```bash
node webhook-server.js
```

4. **Nastavení v GitHub**
   - Jděte do: `Settings → Webhooks → Add webhook`
   - Payload URL: `http://your-server-ip:9000/webhook`
   - Content type: `application/json`
   - Secret: `your-super-secret-key-here` (stejný jako v .env)
   - Events: `Just the push event`
   - Active: ✓

### Spuštění jako systemd service

```bash
sudo vim /etc/systemd/system/kohutka-webhook.service
```

```ini
[Unit]
Description=Kohutka Web Webhook Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/kohutka-web
ExecStart=/usr/bin/node /path/to/kohutka-web/webhook-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable kohutka-webhook
sudo systemctl start kohutka-webhook
```

### Použití s ngrok (pro lokální testování)

```bash
# Instalace ngrok
brew install ngrok  # nebo stáhněte z ngrok.com

# Expose webhook server
ngrok http 9000

# Použijte ngrok URL v GitHub webhook settings
# např. https://abc123.ngrok.io/webhook
```

---

## 4️⃣ CI/CD s GitHub Actions

### Setup

1. **Vytvořte GitHub Secrets**
   - Jděte do: `Settings → Secrets and variables → Actions`
   - Přidejte secrets:
     - `DOCKER_USERNAME` (optional - pro Docker Hub)
     - `DOCKER_PASSWORD` (optional - pro Docker Hub)
     - `DEPLOY_HOST` (IP vašeho serveru)
     - `DEPLOY_USER` (SSH user)
     - `DEPLOY_SSH_KEY` (private SSH key)

2. **Workflow je již vytvořený**
   - Soubor: `.github/workflows/docker-build.yml`
   - Automaticky se spustí při push do `main` branch

3. **SSH Setup na serveru**
```bash
# Na vašem serveru
mkdir -p ~/.ssh
echo "your-public-key" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

4. **Deploy script na serveru**
```bash
# /app/deploy.sh
#!/bin/bash
cd /app/kohutka-web
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Použití s Docker Hub

Pokud chcete používat Docker Hub:

```bash
# Login
docker login

# Tag image
docker tag kohutka-web your-username/kohutka-web:latest

# Push
docker push your-username/kohutka-web:latest
```

Na serveru:
```bash
docker pull your-username/kohutka-web:latest
docker run -d -p 3000:3000 --env-file .env your-username/kohutka-web:latest
```

---

## 📊 Srovnání

| Varianta | Setup | Rychlost | Použití | Doporučení |
|----------|-------|----------|---------|------------|
| **Hot Reload** | ⭐ Snadný | ⚡️ Okamžitá | 💻 Development | ✅ Pro vývoj |
| **Polling Script** | ⭐⭐ Střední | 🐌 1-2 min | 🏠 Malé projekty | ⚠️ Funguje, ale není optimální |
| **Webhook** | ⭐⭐⭐ Složitější | ⚡️ Okamžitá | 🚀 Production | ✅ Doporučeno |
| **GitHub Actions** | ⭐⭐⭐⭐ Složitý | ⚡️ Rychlá | 🏢 Enterprise | ✅✅ Best practice |

---

## 🎯 Doporučený postup

### Pro vývoj:
```bash
docker-compose -f docker-compose.dev.yml up
```

### Pro production (malý projekt):
```bash
./git-auto-update-compose.sh
```

### Pro production (profesionální):
1. Nastavte GitHub Actions
2. Nebo webhook server
3. Automatický deploy po každém push

---

## 🔍 Troubleshooting

### Auto-update script se nezastaví
```bash
# Najděte proces
ps aux | grep git-auto-update

# Zastavte
kill <PID>
```

### Webhook nefunguje
```bash
# Zkontrolujte, jestli server běží
curl http://localhost:9000/health

# Zkontrolujte GitHub webhook delivery
# Settings → Webhooks → Recent Deliveries
```

### Permission denied při git pull
```bash
# Nastavte Git credentials
git config --global credential.helper store
git pull  # Zadejte credentials jednou
```

---

## 📚 Další zdroje

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [GitHub Webhooks](https://docs.github.com/en/webhooks)
- [Watchtower](https://containrrr.dev/watchtower/)

---

**Máte otázky? Přečtěte si DOCKER.md pro základní Docker informace.**
