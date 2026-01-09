import { useSearchParams } from 'react-router-dom';
import StatusImagePreview from '@/components/admin/autopost/StatusImagePreview';
import type { StatusImageData } from '@/components/admin/autopost/types';

/**
 * Stránka pro generování screenshotu FB obrázku.
 * Data se předávají přes URL query parametry.
 * Puppeteer tuto stránku otevře a pořídí screenshot.
 */
export default function StatusImagePage() {
  const [searchParams] = useSearchParams();

  // Parse data z URL
  const data: StatusImageData = {
    isOpen: searchParams.get('isOpen') === 'true',
    temperature: searchParams.get('temperature') || '--',
    weather: searchParams.get('weather') || undefined,
    liftsOpen: parseInt(searchParams.get('liftsOpen') || '0', 10),
    liftsTotal: parseInt(searchParams.get('liftsTotal') || '0', 10),
    slopesOpen: parseInt(searchParams.get('slopesOpen') || '0', 10),
    slopesTotal: parseInt(searchParams.get('slopesTotal') || '0', 10),
    snowHeight: searchParams.get('snowHeight') || '--',
    snowType: searchParams.get('snowType') || undefined,
    operatingHours: searchParams.get('operatingHours') || undefined,
  };

  return (
    <>
      {/* Reset all margins/paddings for screenshot and hide cookie banner */}
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: transparent !important;
        }
        /* Hide cookie consent banner and notifications for Puppeteer screenshot */
        [data-sonner-toaster],
        .cookie-consent,
        [class*="cookie"],
        [class*="Cookie"],
        [id*="cookie"],
        [id*="Cookie"],
        .fixed.bottom-0,
        .fixed.bottom-4,
        .fixed.inset-0,
        .fixed.z-\\[9999\\],
        [class*="max-w-sm"].fixed {
          display: none !important;
          visibility: hidden !important;
        }
      `}</style>
      <div
        id="status-image-container"
        style={{
          width: '1080px',
          height: '1350px',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
          fontSize: '39px', // Scale factor to fit 1080x1350 (56px gave 1918px height, need 1350px)
        }}
      >
        <StatusImagePreview data={data} />
      </div>
    </>
  );
}
