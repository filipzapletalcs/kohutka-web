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
  valueText: '#163a5e', // Dark blue (same as primary) for stat values
};

function StatCard({ icon, label, value, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '1em',
        padding: '0.8em 0.5em',
        flex: '1 1 0',
        backgroundColor: COLORS.white,
        boxShadow: highlight
          ? `0 0.3em 1em rgba(140, 240, 92, 0.35), inset 0 0 0 0.15em ${COLORS.open}`
          : '0 0.3em 1em rgba(22, 58, 94, 0.15)',
      }}
    >
      <div style={{ marginBottom: '0.3em' }}>{icon}</div>
      <div
        style={{
          fontSize: '0.55em',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.15em',
          color: COLORS.mediumGray,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.4em',
          fontWeight: 900,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: COLORS.valueText,
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function StatusImagePreview({ data }: { data: StatusImageData }) {
  const { isOpen, temperature, weather, liftsOpen, liftsTotal, slopesOpen, slopesTotal, snowHeight, snowType, operatingHours } = data;
  const hasLifts = liftsOpen > 0;
  const hasSlopes = slopesOpen > 0;

  const today = new Date();
  const dateStr = today.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).toUpperCase();

  // Icon size relative to container - will scale with font-size
  const iconSize = '1.8em';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: `linear-gradient(180deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
        // fontSize inherited from parent - enables resolution independence
        boxSizing: 'border-box',
      }}
    >
      {/* Inner container - full width with padding */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {/* Header - Logo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '1.5em',
        paddingBottom: '0.5em',
      }}>
        <img src={logo} alt="Kohútka" style={{ height: '4em', width: 'auto', objectFit: 'contain' }} />
        <div style={{
          fontSize: '0.6em',
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginTop: '0.4em',
          color: COLORS.secondary,
        }}>
          SKI CENTRUM KOHUTKA
        </div>
      </div>

      {/* Date */}
      <div style={{ textAlign: 'center', padding: '0.3em 1em' }}>
        <div style={{
          fontSize: '1.1em',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: COLORS.white,
        }}>
          {dateStr}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0.6em 0' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4em',
          padding: '0.4em 1.5em',
          borderRadius: '9999px',
          backgroundColor: isOpen ? COLORS.open : COLORS.closed,
          boxShadow: `0 0.4em 1.2em ${isOpen ? 'rgba(140, 240, 92, 0.5)' : 'rgba(233, 72, 72, 0.5)'}`,
        }}>
          <div style={{
            width: '0.4em',
            height: '0.4em',
            borderRadius: '50%',
            backgroundColor: COLORS.white,
            boxShadow: '0 0 0.4em rgba(255,255,255,0.8)',
          }} />
          <div style={{
            fontSize: '0.9em',
            fontWeight: 900,
            letterSpacing: '0.1em',
            color: isOpen ? COLORS.darkText : COLORS.white,
          }}>
            {isOpen ? 'OTEVŘENO' : 'ZAVŘENO'}
          </div>
        </div>
      </div>

      {/* Stats Grid 2x2 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5em',
        padding: '0.8em 1em',
      }}>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <StatCard
            icon={<Thermometer size={iconSize} color={COLORS.secondary} />}
            label={weather ? `Počasí - ${weather}` : "Počasí"}
            value={temperature || '--'}
          />
          <StatCard
            icon={<CableCar size={iconSize} color={hasLifts ? COLORS.open : COLORS.primary} />}
            label="Lanovky/vleky"
            value={`${liftsOpen}/${liftsTotal}`}
            highlight={hasLifts}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5em' }}>
          <StatCard
            icon={<Mountain size={iconSize} color={hasSlopes ? COLORS.open : COLORS.primary} />}
            label="Sjezdovky"
            value={`${slopesOpen}/${slopesTotal}`}
            highlight={hasSlopes}
          />
          <StatCard
            icon={<Snowflake size={iconSize} color={COLORS.secondary} />}
            label={snowType ? `Sníh - ${snowType}` : "Sníh"}
            value={snowHeight || '--'}
          />
        </div>
      </div>

      {/* Operating Hours */}
      {operatingHours && (
        <div style={{
          margin: '0 1em 0.3em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.3em',
          padding: '0.4em 0.8em',
          borderRadius: '0.5em',
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
        }}>
          <svg width="0.9em" height="0.9em" viewBox="0 0 24 24" fill="none" stroke={COLORS.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
          </svg>
          <span style={{ fontSize: '0.55em', color: 'rgba(255,255,255,0.8)' }}>Provozní doba:</span>
          <span style={{ fontSize: '0.65em', fontWeight: 700, color: COLORS.white }}>{operatingHours}</span>
        </div>
      )}

      {/* Spacer to push content down */}
      <div style={{ flex: 1 }} />

      {/* CTA Button */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5em 1em' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.4em 1.2em',
          borderRadius: '0.5em',
          backgroundColor: COLORS.accent,
          boxShadow: '0 0.3em 1em rgba(140, 240, 92, 0.4)',
        }}>
          <span style={{ fontSize: '0.7em', fontWeight: 700, color: COLORS.darkText }}>Více na kohutka.ski</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5em 1em',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        marginTop: 'auto',
      }}>
        <span style={{ fontSize: '0.6em', fontWeight: 600, color: COLORS.white }}>www.kohutka.ski</span>
        <span style={{ fontSize: '0.45em', color: 'rgba(255,255,255,0.6)' }}>Data: holidayinfo.cz</span>
      </div>
      </div>
    </div>
  );
}
