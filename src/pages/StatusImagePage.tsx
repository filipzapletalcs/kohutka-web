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
    liftsOpen: parseInt(searchParams.get('liftsOpen') || '0', 10),
    liftsTotal: parseInt(searchParams.get('liftsTotal') || '0', 10),
    slopesOpen: parseInt(searchParams.get('slopesOpen') || '0', 10),
    slopesTotal: parseInt(searchParams.get('slopesTotal') || '0', 10),
    snowHeight: searchParams.get('snowHeight') || '--',
    operatingHours: searchParams.get('operatingHours') || undefined,
  };

  return (
    <>
      {/* Reset all margins/paddings for screenshot */}
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          background: transparent !important;
        }
      `}</style>
      <div
        id="status-image-container"
        style={{
          width: 1080,
          height: 1350,
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        <StatusImagePreview data={data} />
      </div>
    </>
  );
}
