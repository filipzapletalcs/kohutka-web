# Nastavení automatické aktualizace ceníku na VPS

## Co to dělá

Skript `scripts/generate-pricing-json.js` generuje statický soubor `public/data/pricing.json` z:
1. Existující cache (`.cache/pricing-cache.json`) - pokud existuje
2. Google Sheets - jako fallback

Frontend pak načítá tento statický soubor **okamžitě** - bez loading stavu.

## Nastavení cron jobu na VPS

Připoj se na VPS a přidej cron job:

```bash
# Připoj se na VPS
ssh deploy@46.36.40.118

# Otevři crontab
crontab -e

# Přidej tento řádek (každou hodinu v minutu 0):
0 * * * * cd /srv/containers/kohutka/app && node scripts/generate-pricing-json.js >> /var/log/kohutka-pricing.log 2>&1
```

## Alternativa: Přidat do Docker compose

Můžeš také přidat periodickou regeneraci přímo do kontejneru. Přidej do `docker-compose.yml`:

```yaml
services:
  web:
    # ... existující konfigurace
    command: >
      sh -c "node scripts/generate-pricing-json.js && node server.js"
```

A přidej cron do kontejneru nebo použij externí cron na hostu.

## Manuální refresh

Pro okamžitou aktualizaci ceníku:

```bash
cd /srv/containers/kohutka/app
node scripts/generate-pricing-json.js
```

## Ověření funkčnosti

```bash
# Zkontroluj, že soubor existuje
ls -la /srv/containers/kohutka/app/public/data/pricing.json

# Zobraz obsah
cat /srv/containers/kohutka/app/public/data/pricing.json | head -20

# Zkontroluj log
tail -f /var/log/kohutka-pricing.log
```
