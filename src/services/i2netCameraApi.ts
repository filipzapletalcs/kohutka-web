/**
 * Service pro načítání kamer z i2net
 *
 * i2net poskytuje:
 * - 3 live HLS streamy (Malá Kohútka, Velká sjezdovka, Kohútka)
 * - 8 statických fotek aktualizovaných každých 5 minut
 */

import { Camera, CameraSource } from '@/types/holidayInfo';

export interface I2NetCamera {
  id: string;
  name: string;
  description: string;
  location?: string;
  hasLiveStream: boolean;
  liveStreamUrl?: string;
  staticImageUrl?: string;
  updateInterval?: number; // v minutách
}

/**
 * Konfigurace i2net kamer
 *
 * POZNÁMKA: URL používají HTTP protokol. Pro HTTPS stránku je potřeba:
 * 1. Čekat na HTTPS na i2net serveru, NEBO
 * 2. Použít proxy podobně jako pro data.kohutka.ski
 */
const I2NET_CONFIG = {
  baseImageUrl: 'http://webcams.i2net.cz/obr',
  baseStreamUrl: 'https://streamer.i2net.cz/live',
  updateInterval: 5, // minuty
  useProxy: true, // TODO: Změnit na false, až bude HTTPS dostupné
};

/**
 * Live streamy z i2net (už používají HTTPS)
 */
const LIVE_STREAMS: I2NetCamera[] = [
  {
    id: 'i2net-stream-01',
    name: 'Kohútka',
    description: 'Live stream z hlavní oblasti',
    hasLiveStream: true,
    liveStreamUrl: `${I2NET_CONFIG.baseStreamUrl}/kohutka01_.m3u8`,
    updateInterval: 0, // Live stream - nepřetržitě
  },
  {
    id: 'i2net-stream-02',
    name: 'Kohútka - Velká sjezdovka',
    description: 'Live stream z velké sjezdovky',
    hasLiveStream: true,
    liveStreamUrl: `${I2NET_CONFIG.baseStreamUrl}/kohutka02_.m3u8`,
    updateInterval: 0,
  },
  {
    id: 'i2net-stream-03',
    name: 'Malá Kohútka',
    description: 'Live stream z malé Kohútky',
    hasLiveStream: true,
    liveStreamUrl: `${I2NET_CONFIG.baseStreamUrl}/kohutka03_.m3u8`,
    updateInterval: 0,
  },
];

/**
 * Statické fotky z i2net (aktualizace každých 5 minut)
 *
 * TODO: Doplnit přesné popisy pro každou kameru
 * TODO: Ověřit, které kamery jsou aktivní
 */
const STATIC_IMAGES: I2NetCamera[] = [
  {
    id: 'i2net-img-01',
    name: 'Kohútka 01',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-01.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
  {
    id: 'i2net-img-02',
    name: 'Kohútka 02',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-02.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
  {
    id: 'i2net-img-03',
    name: 'Kohútka 03',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-03.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
  {
    id: 'i2net-img-04',
    name: 'Kohútka 04',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-04.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
  {
    id: 'i2net-img-11',
    name: 'Kohútka 11',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-11.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
  {
    id: 'i2net-img-12',
    name: 'Kohútka 12',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-12.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
  {
    id: 'i2net-img-13',
    name: 'Kohútka 13',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-13.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
  {
    id: 'i2net-img-14',
    name: 'Kohútka 14',
    description: 'TODO: Doplnit popis',
    hasLiveStream: false,
    staticImageUrl: `${I2NET_CONFIG.baseImageUrl}/kohutka-14.jpg`,
    updateInterval: I2NET_CONFIG.updateInterval,
  },
];

/**
 * Vrátí URL pro statickou fotku s cache busterem
 *
 * @param camera - Kamera z konfigurace
 * @returns URL s timestamp parametrem pro cache busting
 */
function getStaticImageUrl(camera: I2NetCamera): string {
  if (!camera.staticImageUrl) {
    throw new Error(`Camera ${camera.id} nemá staticImageUrl`);
  }

  const baseUrl = camera.staticImageUrl;
  const cacheBuster = Date.now();

  // Pokud používáme proxy pro HTTP obrázky
  if (I2NET_CONFIG.useProxy && baseUrl.startsWith('http://')) {
    // TODO: Implementovat proxy podobně jako camera-proxy.js
    // Pro teď vracíme přímou URL s cache busterem
    return `${baseUrl}?t=${cacheBuster}`;
  }

  return `${baseUrl}?t=${cacheBuster}`;
}

/**
 * Načte všechny i2net kamery (live streamy + statické fotky)
 *
 * @returns Pole všech dostupných i2net kamer
 */
export async function fetchI2NetCameras(): Promise<I2NetCamera[]> {
  try {
    // Kombinujeme live streamy a statické fotky
    const allCameras = [...LIVE_STREAMS, ...STATIC_IMAGES];

    // Pro statické fotky přidáme aktuální URL s cache busterem
    return allCameras.map(camera => ({
      ...camera,
      staticImageUrl: camera.staticImageUrl
        ? getStaticImageUrl(camera)
        : undefined,
    }));
  } catch (error) {
    console.error('Chyba při načítání i2net kamer:', error);
    throw error;
  }
}

/**
 * Načte pouze live streamy
 *
 * @returns Pole live stream kamer
 */
export async function fetchI2NetLiveStreams(): Promise<I2NetCamera[]> {
  return LIVE_STREAMS;
}

/**
 * Načte pouze statické fotky
 *
 * @returns Pole statických fotek
 */
export async function fetchI2NetStaticImages(): Promise<I2NetCamera[]> {
  return STATIC_IMAGES.map(camera => ({
    ...camera,
    staticImageUrl: getStaticImageUrl(camera),
  }));
}

/**
 * Ověří dostupnost i2net kamer
 *
 * @returns true pokud jsou kamery dostupné
 */
export async function checkI2NetAvailability(): Promise<boolean> {
  try {
    // Zkusíme načíst jednu testovací fotku
    const testUrl = `${I2NET_CONFIG.baseImageUrl}/kohutka-01.jpg`;
    const response = await fetch(testUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Převede i2net kameru na unified Camera typ
 *
 * @param i2netCamera - i2net kamera
 * @returns Unified Camera objekt kompatibilní s Holiday Info
 */
export function convertI2NetCameraToUnified(i2netCamera: I2NetCamera): Camera {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('cs-CZ');

  return {
    id: i2netCamera.id,
    name: i2netCamera.name,
    description: i2netCamera.description,
    location: i2netCamera.location || '',
    source: 'i2net' as CameraSource,
    hasVideo: false, // i2net nemá MP4 videa, pouze live streamy
    hasLiveStream: i2netCamera.hasLiveStream,
    liveStreamUrl: i2netCamera.liveStreamUrl,
    updateInterval: i2netCamera.updateInterval,
    media: {
      last_image: {
        url: i2netCamera.staticImageUrl || '',
        url_preview: i2netCamera.staticImageUrl || '', // i2net nemá separátní preview
        temp: undefined, // i2net neposkytuje teplotu
        date: dateStr,
        time: timeStr,
      },
    },
  };
}

/**
 * Načte všechny i2net kamery a převede je na unified typ
 *
 * @returns Pole unified Camera objektů
 */
export async function fetchI2NetCamerasUnified(): Promise<Camera[]> {
  const i2netCameras = await fetchI2NetCameras();
  return i2netCameras.map(convertI2NetCameraToUnified);
}

/**
 * Exporty
 */
export { I2NET_CONFIG, LIVE_STREAMS, STATIC_IMAGES };
