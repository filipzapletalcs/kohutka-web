# Automatická generace grafik pro Facebook

Dokumentace řešení pro automatické generování denních status reportů skiareálu Kohútka jako obrázků pro sociální sítě.

## Přehled řešení

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Holiday Info   │────▶│  Status Image   │────▶│    Facebook     │
│   XML API       │     │   Generator     │     │    Graph API    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌───────────┐
                        │  PNG/JPG  │
                        │  Obrázek  │
                        └───────────┘
```

### Technologický stack

| Komponenta | Technologie | Účel |
|------------|-------------|------|
| Šablona | JSX/React-like syntax | Definice layoutu grafiky |
| JSX → SVG | [Satori](https://github.com/vercel/satori) | Konverze JSX na vektorovou grafiku |
| SVG → PNG | [resvg-js](https://github.com/aspect-dev/resvg-js) | Rasterizace SVG na PNG |
| API | Express.js / Vercel Serverless | HTTP endpoint pro generování |
| Scheduler | node-cron / Vercel Cron | Automatické spouštění |

---

## Architektura

### Tok dat

```
1. CRON trigger (např. každý den v 7:00)
        │
        ▼
2. Fetch dat z Holiday Info API
   - Provozní stav (otevřeno/zavřeno)
   - Počet aktivních vleků
   - Počet otevřených sjezdovek
   - Teplota z kamer
   - Výška sněhu
   - Provozní doba
        │
        ▼
3. Transformace dat pro šablonu
   - Formátování teplot
   - Výpočet statistik
   - Příprava textů
        │
        ▼
4. Renderování grafiky (Satori)
   - JSX šablona + data
   - Výstup: SVG string
        │
        ▼
5. Konverze na PNG (resvg-js)
   - SVG → PNG buffer
   - Optimalizace velikosti
        │
        ▼
6. Upload na Facebook
   - POST /photos endpoint
   - Přidání popisku
```

---

## Závislosti

### Produkční závislosti

```json
{
  "dependencies": {
    "satori": "^0.10.0",
    "@resvg/resvg-js": "^2.6.0",
    "yoga-wasm-web": "^0.3.3"
  }
}
```

### Instalace

```bash
cd kohutka-web
npm install satori @resvg/resvg-js
```

### Fonty

Satori vyžaduje explicitní načtení fontů (nemá přístup k systémovým fontům):

```bash
# Stáhnout fonty do /public/fonts/
mkdir -p public/fonts
# Doporučené: Inter, Roboto, nebo vlastní brand font
```

---

## API Endpoint

### `GET /api/status-image`

Generuje PNG obrázek s aktuálním stavem skiareálu.

#### Query parametry

| Parametr | Typ | Default | Popis |
|----------|-----|---------|-------|
| `format` | `png` \| `svg` | `png` | Výstupní formát |
| `width` | number | `1200` | Šířka obrázku v px |
| `height` | number | `630` | Výška obrázku v px |
| `theme` | `light` \| `dark` | `light` | Barevné schéma |

#### Response

```http
HTTP/1.1 200 OK
Content-Type: image/png
Cache-Control: public, max-age=300
Content-Disposition: inline; filename="kohutka-status-2025-11-26.png"

<binary PNG data>
```

#### Příklad použití

```bash
# Stáhnout obrázek
curl -o status.png "https://kohutka.ski/api/status-image"

# Získat SVG
curl "https://kohutka.ski/api/status-image?format=svg"

# Vlastní rozměry (pro Instagram Stories)
curl -o story.png "https://kohutka.ski/api/status-image?width=1080&height=1920"
```

---

## Implementace

### Struktura souborů

```
kohutka-web/
├── api/
│   └── status-image.js          # API endpoint
├── src/
│   ├── templates/
│   │   ├── StatusImageTemplate.tsx   # JSX šablona
│   │   └── themes/
│   │       ├── light.ts         # Světlé téma
│   │       └── dark.ts          # Tmavé téma
│   └── services/
│       └── imageGenerator.ts    # Generátor obrázků
├── public/
│   └── fonts/
│       ├── Inter-Regular.ttf
│       ├── Inter-Bold.ttf
│       └── Inter-Black.ttf
└── docs/
    └── STATUS_IMAGE_GENERATOR.md
```

### Příklad JSX šablony

```tsx
// src/templates/StatusImageTemplate.tsx

interface StatusData {
  isOpen: boolean;
  liftsOpen: number;
  liftsTotal: number;
  slopesOpen: number;
  slopesTotal: number;
  temperature: string;
  snowHeight: string;
  operatingHours: string;
  date: string;
}

export function StatusImageTemplate({ data }: { data: StatusData }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
        backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '60px',
        fontFamily: 'Inter',
        color: 'white',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '48px' }}>🎿</span>
          <span style={{ fontSize: '42px', fontWeight: 900 }}>KOHÚTKA</span>
        </div>
        <div style={{
          backgroundColor: data.isOpen ? '#22c55e' : '#ef4444',
          padding: '12px 32px',
          borderRadius: '50px',
          fontSize: '24px',
          fontWeight: 700,
        }}>
          {data.isOpen ? 'OTEVŘENO' : 'ZAVŘENO'}
        </div>
      </div>

      {/* Date */}
      <div style={{ fontSize: '24px', opacity: 0.7, marginTop: '20px' }}>
        {data.date}
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '30px',
        marginTop: '50px',
        flex: 1,
      }}>
        {/* Temperature */}
        <StatCard
          icon="🌡️"
          label="Teplota"
          value={data.temperature}
        />

        {/* Lifts */}
        <StatCard
          icon="🚡"
          label="Vleky"
          value={`${data.liftsOpen}/${data.liftsTotal}`}
          highlight={data.liftsOpen > 0}
        />

        {/* Slopes */}
        <StatCard
          icon="⛷️"
          label="Sjezdovky"
          value={`${data.slopesOpen}/${data.slopesTotal}`}
          highlight={data.slopesOpen > 0}
        />

        {/* Snow */}
        <StatCard
          icon="❄️"
          label="Sníh"
          value={data.snowHeight || 'N/A'}
        />
      </div>

      {/* Operating Hours */}
      {data.operatingHours && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '28px',
          marginTop: '30px',
        }}>
          <span>🕐</span>
          <span>Provozní doba: {data.operatingHours}</span>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '40px',
        paddingTop: '30px',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        fontSize: '18px',
        opacity: 0.6,
      }}>
        <span>www.kohutka.ski</span>
        <span>Zdroj: holidayinfo.cz</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, highlight = false }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '20px',
      padding: '30px',
      minWidth: '200px',
      border: highlight ? '2px solid #22c55e' : '2px solid transparent',
    }}>
      <span style={{ fontSize: '40px' }}>{icon}</span>
      <span style={{ fontSize: '18px', opacity: 0.7, marginTop: '10px' }}>{label}</span>
      <span style={{ fontSize: '36px', fontWeight: 800, marginTop: '5px' }}>{value}</span>
    </div>
  );
}
```

### API Endpoint implementace

```javascript
// api/status-image.js

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Načtení fontů
const interRegular = readFileSync(join(process.cwd(), 'public/fonts/Inter-Regular.ttf'));
const interBold = readFileSync(join(process.cwd(), 'public/fonts/Inter-Bold.ttf'));
const interBlack = readFileSync(join(process.cwd(), 'public/fonts/Inter-Black.ttf'));

const HOLIDAYINFO_API = 'https://exports.holidayinfo.cz/xml_export.php';
const HOLIDAYINFO_DC = process.env.HOLIDAYINFO_DC || 'c9ixxlejab5d4mrr';

export default async function handler(req, res) {
  try {
    // 1. Získat data z Holiday Info
    const statusData = await fetchStatusData();

    // 2. Parametry z query stringu
    const width = parseInt(req.query.width) || 1200;
    const height = parseInt(req.query.height) || 630;
    const format = req.query.format || 'png';

    // 3. Vygenerovat SVG pomocí Satori
    const svg = await satori(
      StatusImageTemplate({ data: statusData }),
      {
        width,
        height,
        fonts: [
          { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
          { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
          { name: 'Inter', data: interBlack, weight: 900, style: 'normal' },
        ],
      }
    );

    // 4. Pokud je požadován SVG formát
    if (format === 'svg') {
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(svg);
    }

    // 5. Konverze SVG → PNG pomocí resvg
    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: width },
    });
    const pngBuffer = resvg.render().asPng();

    // 6. Odeslat PNG
    const filename = `kohutka-status-${formatDate(new Date())}.png`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(pngBuffer);

  } catch (error) {
    console.error('Status image generation error:', error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
}

async function fetchStatusData() {
  const response = await fetch(`${HOLIDAYINFO_API}?dc=${HOLIDAYINFO_DC}&localias=kohutka`);
  const xmlText = await response.text();

  // Parse XML (viz existující holidayInfoApi.ts)
  const { DOMParser } = await import('@xmldom/xmldom');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  // Extrakce dat
  const locInfoWinter = xmlDoc.getElementsByTagName('loc_info_winter')[0];
  const operationCode = parseInt(getXMLText(locInfoWinter, 'operation_code')) || 2;
  const isOpen = operationCode === 3 || operationCode === 4;

  // Počítání vleků
  const lifts = xmlDoc.getElementsByTagName('lift');
  let liftsOpen = 0;
  let liftsTotal = 0;
  for (let i = 0; i < lifts.length; i++) {
    const typeCode = parseInt(getXMLText(lifts[i], 'type_code'));
    if (typeCode !== 7) { // Ignorovat dětský skipark
      liftsTotal++;
      const statusCode = parseInt(getXMLText(lifts[i], 'status_code'));
      if (statusCode === 1 || statusCode === 3) liftsOpen++;
    }
  }

  // Počítání sjezdovek
  const slopes = xmlDoc.getElementsByTagName('slope');
  let slopesOpen = 0;
  const slopesTotal = slopes.length;
  for (let i = 0; i < slopes.length; i++) {
    const statusCode = parseInt(getXMLText(slopes[i], 'status_code'));
    if (statusCode === 2 || statusCode === 6) slopesOpen++;
  }

  // Teplota z kamery
  const cam = xmlDoc.querySelector('cam[id="3122"]') || xmlDoc.querySelector('cam');
  const temperature = cam ? getXMLText(cam, 'temp') : '';

  // Výška sněhu
  const snowMin = getXMLText(locInfoWinter, 'snowheight_slopes_min');
  const snowMax = getXMLText(locInfoWinter, 'snowheight_slopes_max');
  let snowHeight = '';
  if (snowMin && snowMax) {
    snowHeight = `${snowMin}-${snowMax} cm`;
  } else if (snowMin || snowMax) {
    snowHeight = `${snowMin || snowMax} cm`;
  }

  // Provozní doba
  const opertime = getXMLText(locInfoWinter, 'opertime');
  const operatingHours = opertime !== '00:00-00:00' ? opertime : '';

  return {
    isOpen,
    liftsOpen,
    liftsTotal,
    slopesOpen,
    slopesTotal,
    temperature: temperature ? `${temperature}°C` : 'N/A',
    snowHeight,
    operatingHours,
    date: new Date().toLocaleDateString('cs-CZ', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }),
  };
}

function getXMLText(element, tagName) {
  if (!element) return '';
  const el = element.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() || '';
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}
```

---

## Formáty a rozměry

### Doporučené rozměry pro sociální sítě

| Platforma | Rozměr | Poměr stran | Použití |
|-----------|--------|-------------|---------|
| Facebook Post | 1200×630 | 1.91:1 | Standardní příspěvek |
| Facebook Cover | 820×312 | 2.63:1 | Cover photo |
| Instagram Post | 1080×1080 | 1:1 | Čtvercový příspěvek |
| Instagram Story | 1080×1920 | 9:16 | Stories |
| Twitter Post | 1200×675 | 16:9 | Tweet s obrázkem |

### Příklad generování pro různé platformy

```bash
# Facebook Post
/api/status-image?width=1200&height=630

# Instagram Post
/api/status-image?width=1080&height=1080

# Instagram Story
/api/status-image?width=1080&height=1920
```

---

## Facebook integrace

### Automatické postování

Pro automatické postování na Facebook budete potřebovat:

1. **Facebook Page Access Token** (dlouhodobý)
2. **Page ID** vašeho profilu

### Endpoint pro publikaci

```javascript
// api/publish-status.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Vygenerovat obrázek
    const imageResponse = await fetch(`${process.env.BASE_URL}/api/status-image`);
    const imageBuffer = await imageResponse.arrayBuffer();

    // 2. Upload na Facebook
    const formData = new FormData();
    formData.append('source', new Blob([imageBuffer]), 'status.png');
    formData.append('caption', generateCaption());
    formData.append('access_token', process.env.FACEBOOK_PAGE_ACCESS_TOKEN);

    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.FACEBOOK_PAGE_ID}/photos`,
      { method: 'POST', body: formData }
    );

    const result = await fbResponse.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    res.json({ success: true, postId: result.post_id });

  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: error.message });
  }
}

function generateCaption() {
  const date = new Date().toLocaleDateString('cs-CZ');
  return `🎿 Denní report - ${date}\n\nAktuální podmínky na Kohútce!\n\n#kohutka #lyze #skiing #beskydy #zima`;
}
```

---

## Automatizace (CRON)

### Vercel Cron Jobs

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/publish-morning-status",
      "schedule": "0 7 * * *"
    },
    {
      "path": "/api/cron/publish-afternoon-status",
      "schedule": "0 14 * * *"
    }
  ]
}
```

### Node-cron (pro vlastní server)

```javascript
// cron/statusPublisher.js
import cron from 'node-cron';

// Každý den v 7:00 a 14:00
cron.schedule('0 7,14 * * *', async () => {
  console.log('Publishing status to Facebook...');

  try {
    const response = await fetch(`${process.env.BASE_URL}/api/publish-status`, {
      method: 'POST',
    });
    const result = await response.json();
    console.log('Published:', result);
  } catch (error) {
    console.error('Failed to publish:', error);
  }
});
```

---

## Testování

### Lokální testování

```bash
# Spustit dev server
npm run dev

# Otevřít v prohlížeči
open http://localhost:3000/api/status-image

# Stáhnout jako soubor
curl -o test.png http://localhost:3000/api/status-image
```

### Debug endpoint

```javascript
// api/status-image-debug.js
export default async function handler(req, res) {
  const data = await fetchStatusData();
  res.json({
    data,
    generatedAt: new Date().toISOString(),
    endpoints: {
      png: '/api/status-image',
      svg: '/api/status-image?format=svg',
      instagram: '/api/status-image?width=1080&height=1080',
    }
  });
}
```

---

## Příklady výstupů

### Varianta "Otevřeno"

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🎿 KOHÚTKA                      ┌──────────────┐ │
│                                   │   OTEVŘENO   │ │
│   Úterý, 26. listopadu 2025       └──────────────┘ │
│                                                     │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│   │ 🌡️        │ │ 🚡        │ │ ⛷️        │       │
│   │ Teplota   │ │ Vleky     │ │ Sjezdovky │       │
│   │ -3.8°C    │ │ 5/6       │ │ 8/10      │       │
│   └───────────┘ └───────────┘ └───────────┘       │
│                                                     │
│   ┌───────────┐ ┌───────────────────────────┐     │
│   │ ❄️        │ │ 🕐 Provoz: 8:30 - 16:00   │     │
│   │ Sníh      │ └───────────────────────────┘     │
│   │ 35-50 cm  │                                   │
│   └───────────┘                                   │
│                                                     │
│   ─────────────────────────────────────────────── │
│   www.kohutka.ski              Zdroj: holidayinfo │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Varianta "Zavřeno"

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🎿 KOHÚTKA                      ┌──────────────┐ │
│                                   │   ZAVŘENO    │ │
│   Úterý, 26. listopadu 2025       └──────────────┘ │
│                                                     │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│   │ 🌡️        │ │ 🚡        │ │ ⛷️        │       │
│   │ Teplota   │ │ Vleky     │ │ Sjezdovky │       │
│   │ -3.8°C    │ │ 0/6       │ │ 0/10      │       │
│   └───────────┘ └───────────┘ └───────────┘       │
│                                                     │
│           Těšíme se na vás v zimní sezóně!        │
│                                                     │
│   ─────────────────────────────────────────────── │
│   www.kohutka.ski              Zdroj: holidayinfo │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Časté problémy

| Problém | Příčina | Řešení |
|---------|---------|--------|
| Font se nezobrazuje | Chybí soubor fontu | Stáhnout .ttf do `public/fonts/` |
| Emoji se nezobrazují | Satori má omezenou podporu | Použít SVG ikony místo emoji |
| Obrázek je prázdný | Chyba v JSX šabloně | Zkontrolovat `display: flex` na root elementu |
| Pomalé generování | Velké rozměry | Snížit rozlišení nebo cachovat |

### Ladění fontů

```javascript
// Test dostupnosti fontů
import { readFileSync, existsSync } from 'fs';

const fontPath = join(process.cwd(), 'public/fonts/Inter-Regular.ttf');
if (!existsSync(fontPath)) {
  console.error('Font not found:', fontPath);
}
```

---

## Další rozvoj

### Možná vylepšení

1. **Více šablon** - různé designy pro různé situace
2. **Animované GIF** - pro Instagram Stories
3. **Lokalizace** - podpora více jazyků
4. **A/B testování** - různé varianty pro měření engagement
5. **Integrace s Instagramem** - automatické publikování
6. **Preview v adminu** - možnost náhledu před publikací

### Metriky k sledování

- Engagement rate příspěvků s obrázky vs. bez
- Reach automatických vs. manuálních postů
- Nejlepší čas pro publikaci

---

## Reference

- [Satori GitHub](https://github.com/vercel/satori)
- [resvg-js GitHub](https://github.com/aspect-dev/resvg-js)
- [Vercel OG Image Examples](https://vercel.com/docs/functions/og-image-generation)
- [Facebook Graph API - Photos](https://developers.facebook.com/docs/graph-api/reference/page/photos/)
