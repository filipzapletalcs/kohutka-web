# Cache systém pro ceník - Dokumentace

## Přehled

Multi-layer cache systém zajišťuje **okamžité načítání ceníku** bez čekání na Google Sheets:

### Cache strategie (3 úrovně):
1. **localStorage cache** (prohlížeč) - ⚡ nejrychlejší, persistentní, přežije refresh stránky
2. **Server API cache** (VPS) - pro sdílení mezi uživateli (pouze v produkci)
3. **Google Sheets** - fallback, pokud cache není dostupná

Výsledek: **Okamžité načítání** v dev i produkci! 🚀

## Jak to funguje

### 1. První načtení stránky
```
Frontend → Server API (produkce) → Google Sheets → localStorage ⏱️ ~2s
         ↓ (dev mode - API nedostupné)
         → Google Sheets → localStorage ⏱️ ~2s
```
Data se uloží do:
- ✅ **localStorage** (prohlížeč) - přežije refresh
- ✅ **Server cache** (VPS) - v produkci, sdílená mezi uživateli

### 2. Refresh stránky / Další návštěva
```
Frontend → localStorage → HOTOVO ⚡ ~10ms
```
**Žádné načítání, žádný loading skeleton!** Data jsou okamžitě dostupná.

### 3. Po expiraci (1 hodina)
Cache automaticky obnoví data na pozadí při dalším požadavku.

## Konfigurace

### Environment proměnné

Přidej do `.env` souboru:

```bash
# Cache TTL v milisekundách (default: 3600000 = 1 hodina)
PRICING_CACHE_TTL=3600000

# Všechny Google Sheets URL (již existující)
VITE_PRICING_DENNI_URL=...
VITE_PRICING_CASOVE_URL=...
VITE_PRICING_SEZONNI_URL=...
VITE_PRICING_JEDNOTLIVE_URL=...
VITE_PRICING_BODOVE_URL=...
VITE_PRICING_OSTATNI_URL=...
VITE_PRICING_INFO_VEK_URL=...
VITE_PRICING_INFO_DULEZITE_URL=...
VITE_PRICING_SLEVY_URL=...
```

## API Endpointy

### 1. Načíst ceník (s cache)

```bash
GET /api/pricing?category={kategorie}
```

**Kategorie:**
- `denni` - Denní jízdenky
- `casove` - Časové jízdenky
- `sezonni` - Sezónní jízdenky
- `jednotlive` - Jednotlivé jízdy
- `bodove` - Bodové jízdenky
- `ostatni` - Ostatní služby
- `info_vek` - Věkové kategorie
- `info_dulezite` - Důležité informace
- `slevy` - Slevy

**Příklad:**
```bash
curl http://localhost:3000/api/pricing?category=denni
```

**Odpověď:**
```json
{
  "data": [...],
  "cached": true,
  "cachedAt": "2025-01-24T10:30:00.000Z",
  "expiresIn": 3420
}
```

### 2. Status cache

Zobrazí stav cache pro všechny kategorie:

```bash
GET /api/pricing?category=status
```

**Příklad:**
```bash
curl http://localhost:3000/api/pricing?category=status
```

**Odpověď:**
```json
{
  "cacheTTL": 3600000,
  "cacheTTLHours": 1,
  "categories": {
    "denni": {
      "cached": true,
      "cachedAt": "2025-01-24T10:30:00.000Z",
      "ageSeconds": 180,
      "expiresInSeconds": 3420,
      "expired": false
    },
    "casove": {
      "cached": false
    }
  }
}
```

### 3. Vymazat cache

Vymaže cache pro konkrétní kategorii nebo celou cache:

```bash
DELETE /api/pricing?category={kategorie}
DELETE /api/pricing  # Vymaže celou cache
```

**Příklad:**
```bash
# Vymazat konkrétní kategorii
curl -X DELETE http://localhost:3000/api/pricing?category=denni

# Vymazat celou cache
curl -X DELETE http://localhost:3000/api/pricing
```

### 4. Refresh cache

Vymaže starou cache a načte nová data:

```bash
POST /api/pricing?category={kategorie}
```

**Příklad:**
```bash
curl -X POST http://localhost:3000/api/pricing?category=denni
```

## Health Check

### Základní health check
```bash
GET /health
```

### Cache health check
```bash
GET /health/cache
```

Zobrazí celkový stav cache systému včetně všech kategorií.

## Jak to funguje

### 1. První načtení
- Frontend zavolá `/api/pricing?category=denni`
- API načte data z Google Sheets
- Data se uloží do cache (in-memory)
- Data se vrátí frontendu

### 2. Následné načtení (v rámci TTL)
- Frontend zavolá `/api/pricing?category=denni`
- API vrátí data z cache (okamžitě, bez volání Google Sheets)
- Odpověď obsahuje `cached: true`

### 3. Po expiraci cache
- API automaticky načte nová data z Google Sheets
- Cache se obnoví
- Data se vrátí frontendu

### 4. Fallback při selhání
- Pokud API selže, frontend zkusí načíst data přímo z Google Sheets
- Dvoustupňový fallback zajišťuje vysokou dostupnost

## Frontend integrace

Frontend automaticky používá multi-layer cache v `pricingService.ts`:

```typescript
// Cache strategie: localStorage → Server API → Google Sheets
const data = await fetchPricingFromGoogleSheets('denni');
```

### Cache flow v pricingService:
1. **Zkontroluje localStorage** - pokud existuje platná cache, vrátí okamžitě ⚡
2. **Zkusí Server API** (v produkci) - pokud úspěšné, uloží do localStorage
3. **Fallback na Google Sheets** - pokud vše selže, načte přímo a uloží do localStorage

## localStorage cache

Data v prohlížeči (localStorage):
- `TTL: 1 hodina` - Cache expiruje po 1 hodině
- **Persistentní** - Přežije refresh stránky, zavření prohlížeče
- **Automatická** - Žádná konfigurace není potřeba

### Vymazání cache v prohlížeči:
Otevři Developer Tools (F12) → Console:
```javascript
// Vymaž celou cache
localStorage.clear()

// Nebo jen pricing cache
Object.keys(localStorage)
  .filter(k => k.startsWith('pricing_cache_'))
  .forEach(k => localStorage.removeItem(k))
```

## Server cache (produkce)

V produkci běží navíc server-side cache:
- `TTL: 1 hodina` (konfigurovatelné přes `PRICING_CACHE_TTL`)
- **Persistentní na disku** - Přežije restart serveru (uloženo v `.cache/pricing-cache.json`)
- **Sdílená mezi uživateli** - První uživatel naplní cache pro všechny

**Výsledek:** Triple-layer cache = okamžité načítání ceníku! 🚀

## Deployment

### Docker
Cache běží automaticky v Docker kontejneru:

```bash
# Build a spuštění
docker-compose -f docker-compose.prod.yml up -d --build

# Kontrola logů
docker logs kohutka-web
```

### Monitoring
```bash
# Zkontroluj cache status
curl http://localhost:3000/health/cache

# Sleduj logy
docker logs -f kohutka-web
```

## Údržba

### Manuální refresh cache
Pokud aktualizuješ data v Google Sheets a chceš okamžitě obnovit cache:

```bash
# Refresh konkrétní kategorie
curl -X POST http://localhost:3000/api/pricing?category=denni

# Nebo vymaž celou cache (automaticky se načte při dalším požadavku)
curl -X DELETE http://localhost:3000/api/pricing
```

### Změna TTL
1. Uprav `PRICING_CACHE_TTL` v `.env`
2. Restartuj Docker kontejner:
```bash
docker-compose -f docker-compose.prod.yml restart kohutka-web
```

## Výhody tohoto řešení

✅ **Okamžité načítání** - localStorage cache = žádný loading skeleton při refreshi
✅ **Funguje všude** - Dev i prod, offline ready po prvním načtení
✅ **Triple-layer cache** - localStorage → Server API → Google Sheets
✅ **Snížení zátěže** - Minimální požadavky na Google Sheets
✅ **Vysoká dostupnost** - Třístupňový fallback mechanismus
✅ **Persistentní** - Cache přežije restart prohlížeče i serveru
✅ **Jednoduché** - Žádné externí závislosti (Redis, Memcached)
✅ **Konfigurovatelné** - TTL přes environment proměnné
✅ **Monitoring** - Health check endpointy

## Troubleshooting

### Loading skeleton se stále zobrazuje při refreshi
**Řešení:** Vymaž cache v prohlížeči a načti znovu:
```javascript
// V Developer Tools Console (F12)
localStorage.clear()
location.reload()
```
Po prvním načtení by měl být ceník okamžitý i při refreshi.

### Data se neaktualizují po změně v Google Sheets
**Řešení:** Vymaž localStorage cache:
```javascript
// V Developer Tools Console
Object.keys(localStorage)
  .filter(k => k.startsWith('pricing_cache_'))
  .forEach(k => localStorage.removeItem(k))
location.reload()
```

### API endpoints nefungují v dev módu
To je **očekávané** - v dev módu (`npm run dev`) běží pouze Vite dev server.
- ✅ **localStorage cache funguje** - data se ukládají lokálně
- ✅ **Fallback na Google Sheets** - pokud localStorage je prázdná
- 🟡 **Server API cache nefunguje** - není potřeba v dev módu

Pro testování server API:
```bash
# Build a spuštění produkčního serveru
npm run build
npm start

# Nebo použij Docker
docker-compose up
```

### Kontrola cache v produkci
```bash
# Zkontroluj server cache status
curl http://localhost:3000/health/cache

# Zkontroluj logy
docker logs kohutka-web

# Manuální refresh server cache
curl -X POST http://localhost:3000/api/pricing?category=denni
```

### Google Sheets URL nefungují
Zkontroluj `.env` soubor, že obsahuje všechny `VITE_PRICING_*` proměnné.

### Cache na serveru se smazala po restartu
**Ne!** Server cache je **persistentní** - ukládá se do `.cache/pricing-cache.json`.
Cache se automaticky obnoví ze souboru při startu serveru.
