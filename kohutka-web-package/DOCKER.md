# Docker Deployment Guide

Tento dokument popisuje, jak spustit Kohútka Web v Docker kontejneru.

## Požadavky

- Docker Desktop nebo Docker Engine (verze 20.10+)
- Docker Compose (verze 2.0+)

## Rychlý start

### 1. Nastavení environment variables

Zkopírujte vzorový soubor a nastavte hodnoty:

```bash
cp .env.docker.example .env
```

Upravte `.env` soubor a nastavte `HOLIDAYINFO_DC`:

```bash
HOLIDAYINFO_DC=c9ixxlejab5d4mrr
NODE_ENV=production
PORT=3000
```

### 2. Build a spuštění pomocí Docker Compose (doporučeno)

```bash
docker-compose up -d
```

Aplikace bude dostupná na: **http://localhost:3000**

### 3. Alternativa: Build a spuštění ručně

```bash
# Build image
docker build -t kohutka-web .

# Spuštění kontejneru
docker run -d \
  --name kohutka-web \
  -p 3000:3000 \
  -e HOLIDAYINFO_DC=c9ixxlejab5d4mrr \
  kohutka-web
```

## Správa kontejneru

### Zobrazit logy

```bash
docker-compose logs -f
```

nebo

```bash
docker logs -f kohutka-web
```

### Zastavit kontejner

```bash
docker-compose down
```

nebo

```bash
docker stop kohutka-web
docker rm kohutka-web
```

### Restartovat kontejner

```bash
docker-compose restart
```

nebo

```bash
docker restart kohutka-web
```

### Zkontrolovat health status

```bash
curl http://localhost:3000/health
```

Mělo by vrátit:
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T..."
}
```

## Export a import Docker image

### Export image pro kolegu

```bash
# Build image
docker build -t kohutka-web .

# Export do .tar souboru
docker save -o kohutka-web.tar kohutka-web

# Komprese (volitelné, ale doporučené)
gzip kohutka-web.tar
```

Pošlete soubor `kohutka-web.tar.gz` kolegovi.

### Import image (pro kolegu)

```bash
# Dekomprese (pokud je komprimované)
gunzip kohutka-web.tar.gz

# Import image
docker load -i kohutka-web.tar

# Ověření importu
docker images | grep kohutka-web

# Vytvoření .env souboru
cat > .env << EOF
HOLIDAYINFO_DC=c9ixxlejab5d4mrr
NODE_ENV=production
PORT=3000
EOF

# Spuštění kontejneru
docker run -d \
  --name kohutka-web \
  -p 3000:3000 \
  --env-file .env \
  kohutka-web

# Otevřít v prohlížeči
open http://localhost:3000
```

## Struktura kontejneru

```
/app
├── dist/               # Built static files
├── api/                # API routes (serverless-like)
├── server.js           # Express server
├── package.json
└── node_modules/       # Production dependencies
```

## API Endpoints

Kontejner obsahuje tyto API endpointy:

- `GET /api/holidayinfo-image` - Proxy pro obrázky z kamer
- `GET /api/holidayinfo-video` - Proxy pro video soubory
- `GET /api/holidayinfo-panorama` - Proxy pro panoramatické snímky
- `GET /api/holidayinfo-test` - Testovací endpoint
- `GET /api/camera-proxy` - Proxy pro kamery

## Troubleshooting

### Port 3000 je již používán

Změňte port v `.env` souboru nebo při spuštění:

```bash
docker run -d -p 8080:3000 --env-file .env kohutka-web
```

Aplikace bude na: http://localhost:8080

### API routes nefungují

Zkontrolujte, že je `HOLIDAYINFO_DC` správně nastavený v `.env`:

```bash
docker exec kohutka-web env | grep HOLIDAYINFO_DC
```

### Kontejner se nezastaví

```bash
docker kill kohutka-web
docker rm kohutka-web
```

### Rebuild po změnách

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

Pro produkční nasazení doporučujeme:

1. **Použít reverse proxy** (nginx, Traefik):
   ```nginx
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
   }
   ```

2. **Nastavit SSL/TLS certifikát** (Let's Encrypt)

3. **Použít Docker secrets** pro citlivé hodnoty místo .env

4. **Nastavit resource limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 512M
       reservations:
         cpus: '0.5'
         memory: 256M
   ```

## Kontakt

Pro otázky ohledně Docker deployment kontaktujte development team.
