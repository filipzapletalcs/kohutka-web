# Holidayinfo Kamery - Implementace

## Co bylo implementováno

### 1. Bezpečné API Proxy Endpointy
Vytvořené serverless funkce pro Vercel:

- **`/api/holidayinfo-image.js`** - Proxy pro obrázky z kamer
  - Parametry: `camid`, `cropaspect`, `outw`, `outh`
  - Příklad: `/api/holidayinfo-image?camid=2122&cropaspect=16:9&outw=1280`

- **`/api/holidayinfo-video.js`** - Proxy pro video soubory
  - Parametry: `camid`, `size`, `ext`
  - Příklad: `/api/holidayinfo-video?camid=2122&size=full&ext=mp4`

- **`/api/holidayinfo-panorama.js`** - Proxy pro panoramatické snímky
  - Parametry: `camid`, `cropaspect`, `outw`, `outh`
  - Příklad: `/api/holidayinfo-panorama?camid=2122&cropaspect=16:9&outw=1920`

- **`/api/holidayinfo-test.js`** - Testovací endpoint
  - Vrací strukturovaná data o všech kamerách a jejich podporovaných funkcích
  - Použití: `/api/holidayinfo-test`

### 2. Rozšířené Typy
V `src/types/holidayInfo.ts`:

```typescript
interface Camera {
  // ... existing fields
  hasPanorama?: boolean;
  media: {
    last_image: { ... };
    last_video?: {
      url: string;
      datetime?: string;
      direct_url?: string;  // Nové - přímý přístup přes proxy
    };
    last_panorama?: {       // Nové
      url: string;
      datetime?: string;
    };
  };
}
```

### 3. Aktualizovaná API Služba
V `src/services/holidayInfoApi.ts`:

- Helper funkce automaticky používají proxy v produkci
- V development módu volají Holidayinfo API přímo (pro rychlé testování)
- Parsování XML rozšířeno o panorama a video data

### 4. UI Komponenty
- `src/pages/Cameras.tsx` - Přidána podpora pro zobrazení panoram a videí
- `src/pages/ApiDebug.tsx` - Rozšířena o testování podpory kamer

## Bezpečnost

### DŮLEŽITÉ: Environment Variables
Pro produkci nastav v Vercel:

```bash
HOLIDAYINFO_DC=c9ixxlejab5d4mrr
```

V `.env.local` (pro lokální development):

```bash
VITE_HOLIDAYINFO_DC=c9ixxlejab5d4mrr
```

### Proč je to bezpečné?
1. ✅ Download kód není nikdy viditelný ve frontendu v produkci
2. ✅ Všechny requesty jdou přes serverless funkce
3. ✅ Cache je správně nastavená (5 minut)
4. ✅ Validace parametrů na server-side

### Development vs Production
- **Development**: Volá Holidayinfo API přímo (rychlejší testování, ale credentials ve FE)
- **Production**: Volá přes `/api/*` proxy endpointy (bezpečné)

## Testování

### 1. Lokální testování bez Vercel CLI
```bash
npm run dev
```
Kamery fungují přímo přes Holidayinfo API (credentials v kódu - OK pro dev).

### 2. Lokální testování s Vercel CLI (doporučeno)
```bash
npm install -g vercel
vercel dev
```
Testuje s reálnými API routes jako v produkci.

### 3. Testovací stránka
Otevři: `http://localhost:5173/api-debug`
- Klikni na "Test Camera Features"
- Zobrazí všechny kamery a jejich podporu (image, video, panorama)
- Náhledy obrázků a videí

## Podporované funkce kamer

Po otestování přes `/api/holidayinfo-test` dostaneš strukturované informace:

```json
{
  "totalCameras": 5,
  "summary": {
    "withVideo": 2,
    "withPanorama": 1,
    "withHotspots": 0
  },
  "cameras": [
    {
      "id": "2122",
      "name": "Kohútka panorama",
      "features": {
        "hasImage": true,
        "hasVideo": false,
        "hasPanorama": true,
        "hasHotspots": false
      },
      "proxyUrls": {
        "image": "/api/holidayinfo-image?camid=2122...",
        "panorama": "/api/holidayinfo-panorama?camid=2122..."
      }
    }
  ]
}
```

## Deployment na Vercel

1. **Nastav Environment Variable**:
   ```
   Vercel Dashboard → Settings → Environment Variables
   HOLIDAYINFO_DC = c9ixxlejab5d4mrr
   ```

2. **Deploy**:
   ```bash
   git add .
   git commit -m "Add Holidayinfo camera proxy endpoints"
   git push
   ```

3. **Verify**:
   Otevři: `https://tvuj-web.vercel.app/api/holidayinfo-test`

## Příklady použití

### Zobrazit obrázek z kamery
```tsx
<img src="/api/holidayinfo-image?camid=2122&cropaspect=16:9&outw=1280" />
```

### Přehrát video z kamery
```tsx
<video controls>
  <source
    src="/api/holidayinfo-video?camid=2122&size=full&ext=mp4"
    type="video/mp4"
  />
</video>
```

### Zobrazit panorama
```tsx
<img src="/api/holidayinfo-panorama?camid=2122&cropaspect=16:9&outw=1920" />
```

## Rozšíření v budoucnu

### Přidat galerii snímků
Vytvořit nové endpointy pro historické snímky:
- `/api/holidayinfo-gallery-image.js` (s parametrem `galidx` nebo `galdt`)
- `/api/holidayinfo-gallery-video.js`

### Přidat live refresh
Použít React Query s automatickým refetch:
```tsx
const { data } = useQuery({
  queryKey: ['camera', camid],
  queryFn: () => fetch(`/api/holidayinfo-image?camid=${camid}`),
  refetchInterval: 60000, // 1 minuta
});
```

## Troubleshooting

### Kamery se nenačítají v dev módu
✅ Normální - používá přímý přístup k Holidayinfo API (může být blokován CORS)
✅ Řešení: Použij `vercel dev` nebo otestuj v produkci

### 401/403 chyby v produkci
❌ Zkontroluj environment variables ve Vercel Dashboard
❌ Zkontroluj, že `HOLIDAYINFO_DC` je správně nastavený

### Obrázky jsou příliš velké/malé
✅ Uprav parametry `outw` a `outh` v `buildProxyImageUrl()`
✅ Nebo použij `cropaspect` pro zachování poměru stran

## Kontakt
Pro dotazy k Holidayinfo API dokumentaci viz:
- `holidayinfo_exports` dokumentace (poskytnutá v konverzaci)
- Holidayinfo podpora
