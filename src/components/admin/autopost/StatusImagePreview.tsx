import { Thermometer, CableCar, Snowflake, Mountain } from 'lucide-react';
import logo from '@/assets/logo.png';
import type { StatusImageData } from './types';

const COLORS = {
  gradientStart: '#163a5e',
  gradientEnd: '#0b8eb8',
  open: '#8cf05c',
  closed: '#e94848',
  accent: '#8cf05c',
  primary: '#163a5e',
  secondary: '#54d0f7',
  white: '#ffffff',
  mediumGray: '#64748b',
  darkText: '#0f2942',
};

function StatCard({ icon, label, value, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-[16px] p-3 flex-1"
      style={{
        backgroundColor: COLORS.white,
        boxShadow: highlight
          ? `0 4px 16px rgba(140, 240, 92, 0.3), inset 0 0 0 2px ${COLORS.open}`
          : '0 4px 16px rgba(22, 58, 94, 0.12)',
      }}
    >
      <div className="mb-1">{icon}</div>
      <div
        className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
        style={{ color: COLORS.mediumGray }}
      >
        {label}
      </div>
      <div
        className="text-xl font-black leading-none"
        style={{ color: highlight ? COLORS.open : COLORS.primary }}
      >
        {value}
      </div>
    </div>
  );
}

const ICON_SIZE = 28;

export default function StatusImagePreview({ data }: { data: StatusImageData }) {
  const { isOpen, temperature, liftsOpen, liftsTotal, slopesOpen, slopesTotal, snowHeight, operatingHours } = data;
  const hasLifts = liftsOpen > 0;
  const hasSlopes = slopesOpen > 0;

  const today = new Date();
  const dateStr = today.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).toUpperCase();

  return (
    <div
      className="w-full flex flex-col"
      style={{
        aspectRatio: '1080/1350',
        background: `linear-gradient(180deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Header - Logo */}
      <div className="flex flex-col items-center pt-4 pb-2 px-3">
        <img src={logo} alt="Kohutka" className="h-16 w-auto object-contain" />
        <div
          className="text-[10px] font-bold tracking-[3px] uppercase mt-1"
          style={{ color: COLORS.secondary }}
        >
          SKI CENTRUM KOHUTKA
        </div>
      </div>

      {/* Date */}
      <div className="text-center px-3 py-1">
        <div
          className="text-base font-black uppercase tracking-wide"
          style={{ color: COLORS.white }}
        >
          {dateStr}
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center py-2">
        <div
          className="flex items-center gap-2 px-6 py-1.5 rounded-full"
          style={{
            backgroundColor: isOpen ? COLORS.open : COLORS.closed,
            boxShadow: `0 8px 24px ${isOpen ? 'rgba(140, 240, 92, 0.5)' : 'rgba(233, 72, 72, 0.5)'}`,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: COLORS.white,
              boxShadow: '0 0 8px rgba(255,255,255,0.8)',
            }}
          />
          <div
            className="text-base font-black tracking-wider"
            style={{ color: isOpen ? COLORS.darkText : COLORS.white }}
          >
            {isOpen ? 'OTEVRENO' : 'ZAVRENO'}
          </div>
        </div>
      </div>

      {/* Stats Grid 2x2 */}
      <div className="flex-1 flex flex-col gap-2 px-3 py-2 min-h-0">
        <div className="flex gap-2 flex-1 min-h-0">
          <StatCard icon={<Thermometer size={ICON_SIZE} color={COLORS.secondary} />} label="Teplota" value={temperature || '--'} />
          <StatCard icon={<CableCar size={ICON_SIZE} color={hasLifts ? COLORS.open : COLORS.primary} />} label="Vleky" value={`${liftsOpen}/${liftsTotal}`} highlight={hasLifts} />
        </div>
        <div className="flex gap-2 flex-1 min-h-0">
          <StatCard icon={<Mountain size={ICON_SIZE} color={hasSlopes ? COLORS.open : COLORS.primary} />} label="Sjezdovky" value={`${slopesOpen}/${slopesTotal}`} highlight={hasSlopes} />
          <StatCard icon={<Snowflake size={ICON_SIZE} color={COLORS.secondary} />} label="Snih" value={snowHeight || '--'} />
        </div>
      </div>

      {/* Operating Hours */}
      {operatingHours && (
        <div className="mx-3 mb-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.8)' }}>Provozni doba:</span>
          <span className="text-xs font-bold" style={{ color: COLORS.white }}>{operatingHours}</span>
        </div>
      )}

      {/* CTA Button */}
      <div className="flex justify-center py-2 px-3">
        <div className="flex items-center px-5 py-1.5 rounded-lg" style={{ backgroundColor: COLORS.accent, boxShadow: '0 6px 20px rgba(140, 240, 92, 0.4)' }}>
          <span className="text-xs font-bold" style={{ color: COLORS.darkText }}>Vice na kohutka.ski</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center px-3 py-1.5" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
        <span className="text-[10px] font-semibold" style={{ color: COLORS.white }}>www.kohutka.ski</span>
        <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Data: holidayinfo.cz</span>
      </div>
    </div>
  );
}
