/**
 * Status Image Template pro Facebook (4:5)
 * V4 - Větší logo, výraznější datum, komplexnější design
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Načtení loga
let LOGO_BASE64 = null;
try {
  const logoPath = join(__dirname, '..', 'assets', 'logo.png');
  const logoBuffer = readFileSync(logoPath);
  LOGO_BASE64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch (e) {
  console.warn('Logo se nepodařilo načíst:', e.message);
}

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

// ===== SVG IKONY =====
function createIcon(paths, color, size = 52) {
  return {
    type: 'svg',
    props: {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      children: paths.map(p => ({
        type: p.type || 'path',
        props: { ...p, stroke: color, strokeWidth: p.strokeWidth || 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
      }))
    }
  };
}

const ICONS = {
  thermometer: (color) => createIcon([
    { d: 'M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z' }
  ], color),
  lift: (color) => createIcon([
    { d: 'M4 4l16 4' },
    { d: 'M8 8v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8' },
    { type: 'rect', x: 6, y: 14, width: 12, height: 8, rx: 2 }
  ], color),
  slope: (color) => createIcon([
    { type: 'circle', cx: 18, cy: 4, r: 2 },
    { d: 'M10 4L12 10L8 14M18 6L14 10L16 16L12 20M2 20L22 16' }
  ], color),
  snow: (color) => createIcon([
    { d: 'M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07', strokeWidth: 1.5 }
  ], color),
  clock: (color) => createIcon([
    { type: 'circle', cx: 12, cy: 12, r: 10 },
    { d: 'M12 6v6l4 2' }
  ], color, 28),
};

// ===== KOMPONENTY =====
function StatCard({ icon, label, value, highlight }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.white,
        borderRadius: '20px',
        padding: '24px 16px',
        flex: 1,
        boxShadow: highlight
          ? `0 6px 24px rgba(140, 240, 92, 0.3), inset 0 0 0 3px ${COLORS.open}`
          : '0 6px 24px rgba(22, 58, 94, 0.12)',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', marginBottom: '12px' },
            children: icon
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '12px',
              fontWeight: 700,
              color: COLORS.mediumGray,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: '6px',
            },
            children: label
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '42px',
              fontWeight: 900,
              color: highlight ? COLORS.open : COLORS.primary,
              lineHeight: 1,
            },
            children: value
          }
        }
      ]
    }
  };
}

function StatusBadge({ isOpen }) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        backgroundColor: isOpen ? COLORS.open : COLORS.closed,
        padding: '16px 48px',
        borderRadius: '100px',
        boxShadow: `0 10px 36px ${isOpen ? 'rgba(140, 240, 92, 0.5)' : 'rgba(233, 72, 72, 0.5)'}`,
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: '14px',
              height: '14px',
              backgroundColor: COLORS.white,
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(255,255,255,0.8)',
            }
          }
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: '28px',
              fontWeight: 900,
              color: isOpen ? COLORS.darkText : COLORS.white,
              letterSpacing: '3px',
            },
            children: isOpen ? 'OTEVŘENO' : 'ZAVŘENO'
          }
        }
      ]
    }
  };
}

// ===== HLAVNÍ TEMPLATE =====
export function createStatusTemplate(data) {
  const { isOpen, liftsOpen, liftsTotal, slopesOpen, slopesTotal, temperature, snowHeight, operatingHours, date } = data;
  const hasLifts = liftsOpen > 0;
  const hasSlopes = slopesOpen > 0;

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        fontFamily: 'Inter',
        background: `linear-gradient(180deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%)`,
      },
      children: [
        // ===== HEADER - Logo a název =====
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 32px 24px',
            },
            children: [
              // Logo
              LOGO_BASE64 ? {
                type: 'img',
                props: { src: LOGO_BASE64, width: 220, height: 180, style: { objectFit: 'contain' } }
              } : null,
              // Název
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: '18px',
                    fontWeight: 700,
                    color: COLORS.secondary,
                    letterSpacing: '6px',
                    textTransform: 'uppercase',
                    marginTop: '8px',
                  },
                  children: 'SKI CENTRUM KOHÚTKA'
                }
              },
            ].filter(Boolean)
          }
        },

        // ===== DATUM - Velké a výrazné =====
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'center',
              padding: '16px 32px',
            },
            children: [{
              type: 'div',
              props: {
                style: {
                  fontSize: '36px',
                  fontWeight: 900,
                  color: COLORS.white,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  textAlign: 'center',
                },
                children: date
              }
            }]
          }
        },

        // ===== STATUS BADGE =====
        {
          type: 'div',
          props: {
            style: { display: 'flex', justifyContent: 'center', marginBottom: '24px' },
            children: [StatusBadge({ isOpen })]
          }
        },

        // ===== STATS GRID 2x2 =====
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '0 32px',
              flex: 1,
            },
            children: [
              // Row 1
              {
                type: 'div',
                props: {
                  style: { display: 'flex', gap: '12px' },
                  children: [
                    StatCard({ icon: ICONS.thermometer(COLORS.secondary), label: 'Teplota', value: temperature }),
                    StatCard({ icon: ICONS.lift(hasLifts ? COLORS.open : COLORS.primary), label: 'Lanovky/vleky', value: `${liftsOpen}/${liftsTotal}`, highlight: hasLifts }),
                  ]
                }
              },
              // Row 2
              {
                type: 'div',
                props: {
                  style: { display: 'flex', gap: '12px' },
                  children: [
                    StatCard({ icon: ICONS.slope(hasSlopes ? COLORS.open : COLORS.primary), label: 'Sjezdovky', value: `${slopesOpen}/${slopesTotal}`, highlight: hasSlopes }),
                    StatCard({ icon: ICONS.snow(COLORS.secondary), label: 'Sníh', value: snowHeight }),
                  ]
                }
              },
            ]
          }
        },

        // ===== PROVOZNÍ DOBA (pokud je) =====
        operatingHours ? {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              margin: '20px 32px 0',
              padding: '16px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
            },
            children: [
              { type: 'div', props: { style: { display: 'flex' }, children: ICONS.clock(COLORS.white) } },
              { type: 'div', props: { style: { fontSize: '16px', color: 'rgba(255,255,255,0.8)' }, children: 'Provozní doba:' } },
              { type: 'div', props: { style: { fontSize: '22px', fontWeight: 800, color: COLORS.white }, children: operatingHours } },
            ]
          }
        } : null,

        // ===== CTA TLAČÍTKO =====
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'center',
              padding: '24px 32px',
            },
            children: [{
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: COLORS.accent,
                  padding: '16px 36px',
                  borderRadius: '14px',
                  boxShadow: '0 8px 28px rgba(140, 240, 92, 0.4)',
                },
                children: [
                  { type: 'div', props: { style: { fontSize: '18px', fontWeight: 800, color: COLORS.darkText }, children: 'Více na kohutka.ski' } },
                ]
              }
            }]
          }
        },

        // ===== FOOTER =====
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 32px',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
            },
            children: [
              { type: 'div', props: { style: { fontSize: '15px', fontWeight: 600, color: COLORS.white }, children: 'www.kohutka.ski' } },
              { type: 'div', props: { style: { fontSize: '12px', color: 'rgba(255,255,255,0.6)' }, children: 'Data: holidayinfo.cz' } },
            ]
          }
        },
      ].filter(Boolean)
    }
  };
}

export const DEFAULT_WIDTH = 1080;
export const DEFAULT_HEIGHT = 1350;
export { COLORS };
