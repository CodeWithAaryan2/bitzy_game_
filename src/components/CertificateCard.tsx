/**
 * src/components/CertificateCard.tsx
 * Bitzy certificate — cream/navy/gold design.
 *
 * IMPORTANT FIXES from last version:
 * 1. NO emoji characters anywhere. The 📅 emoji renders as an actual OS
 *    calendar graphic showing TODAY'S real date on some platforms (Linux
 *    Noto Color Emoji does this) — that's why "17 / July" appeared baked
 *    into the icon, colliding with our real "Date Issued" text. Replaced
 *    with a plain hand-drawn SVG calendar icon instead.
 * 2. Uses your real mascot image + your real "Sapandey" signature image
 *    instead of emoji/cursive-font text.
 * 3. No negative-margin stacking hacks between headings — those broke
 *    when captured at a different effective scale during PDF export.
 *    Every block now has real spacing via marginTop only (never negative),
 *    so the layout can't collapse/overlap regardless of how it's captured.
 */
import { forwardRef } from 'react';

interface CertificateCardProps {
  userName: string;
  courseName: string;
  dateIssued: string;    // already formatted, e.g. "05 July 2026"
  certificateId: string; // kept for data purposes, not shown in this layout
}

const NAVY = '#0f1f3d';
const GOLD = '#c9a227';

const CertificateCard = forwardRef<HTMLDivElement, CertificateCardProps>(
  ({ userName, courseName, dateIssued }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 1536,
          height: 1024,
          position: 'relative',
          background: '#faf7f0',
          fontFamily: "'Inter', system-ui, sans-serif",
          color: NAVY,
          overflow: 'hidden',
          border: `2px solid ${NAVY}`,
          boxSizing: 'border-box',
        }}
      >
        {/* inner gold border */}
        <div style={{ position: 'absolute', inset: 22, border: `1.5px solid ${GOLD}`, pointerEvents: 'none' }} />

        {/* top-left diagonal navy/gold banner */}
        <svg width="420" height="420" style={{ position: 'absolute', top: 0, left: 0 }}>
          <polygon points="0,0 420,0 0,420" fill={NAVY} />
          <polygon points="0,0 340,0 0,340" fill="none" stroke={GOLD} strokeWidth="4" />
          <polygon points="0,0 260,0 0,260" fill="none" stroke={GOLD} strokeWidth="2" />
        </svg>
        {/* bottom-right diagonal navy/gold banner */}
        <svg width="420" height="420" style={{ position: 'absolute', bottom: 0, right: 0 }}>
          <polygon points="420,420 0,420 420,0" fill={NAVY} />
          <polygon points="420,420 80,420 420,80" fill="none" stroke={GOLD} strokeWidth="4" />
          <polygon points="420,420 160,420 420,160" fill="none" stroke={GOLD} strokeWidth="2" />
        </svg>

        {/* corner stars (plain SVG, not emoji) */}
        <svg width="20" height="20" style={{ position: 'absolute', top: 30, right: 44 }} viewBox="0 0 24 24">
          <polygon points="12,1 15,9 23,9 16.5,14 19,22 12,17 5,22 7.5,14 1,9 9,9" fill={GOLD} />
        </svg>
        <svg width="20" height="20" style={{ position: 'absolute', bottom: 30, left: 44 }} viewBox="0 0 24 24">
          <polygon points="12,1 15,9 23,9 16.5,14 19,22 12,17 5,22 7.5,14 1,9 9,9" fill={GOLD} />
        </svg>

        {/* main content column — plain flow, no absolute overlap tricks */}
        <div style={{
          position: 'relative', width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          paddingTop: 44, boxSizing: 'border-box', textAlign: 'center',
        }}>
          {/* logo (real mascot image) */}
          <img src="/certificate/mascot.png" alt="Bitzy" style={{ width: 100, height: 100, objectFit: 'contain' }} />
          <div style={{ fontSize: 12, letterSpacing: 3, marginTop: 10, color: NAVY, lineHeight: 1 }}>
            LEVEL <span style={{ color: '#2f7de1' }}>UP</span> YOUR CODING SKILLS
          </div>

          {/* title block */}
          <div style={{
            fontFamily: "'Playfair Display', 'Georgia', serif", fontSize: 74, fontWeight: 700,
            marginTop: 26, color: NAVY, letterSpacing: 2, lineHeight: 1,
          }}>CERTIFICATE</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 14 }}>
            <div style={{ width: 90, height: 1, background: GOLD }} />
            <div style={{ fontSize: 18, letterSpacing: 6, color: GOLD, fontWeight: 700, lineHeight: 1 }}>OF COURSE COMPLETION</div>
            <div style={{ width: 90, height: 1, background: GOLD }} />
          </div>

          {/* presented to */}
          <div style={{ fontSize: 13, letterSpacing: 4, color: NAVY, marginTop: 28, display: 'flex', alignItems: 'center', gap: 16, lineHeight: 1 }}>
            <div style={{ width: 60, height: 1, background: GOLD }} />
            PROUDLY PRESENTED TO
            <div style={{ width: 60, height: 1, background: GOLD }} />
          </div>

          <div style={{
            fontFamily: "'Dancing Script', cursive", fontWeight: 700, fontSize: 66, marginTop: 16, color: NAVY, lineHeight: 1,
          }}>
            {userName}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, width: 560 }}>
            <div style={{ flex: 1, height: 1, background: GOLD }} />
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
            <div style={{ flex: 1, height: 1, background: GOLD }} />
          </div>

          {/* description */}
          <div style={{ fontSize: 16, lineHeight: 1.7, color: '#1a2440', maxWidth: 760, marginTop: 20 }}>
            for successfully completing the <strong>{courseName}</strong> on <strong style={{ color: '#2f7de1' }}>Bitzy</strong>.
            <br />This achievement reflects your dedication, consistency, and passion for learning and building.
          </div>

          {/* bottom row: date | badge | signature */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 120, marginTop: 40, width: '100%' }}>
            <div style={{ textAlign: 'center', width: 180 }}>
              <div style={{ display: 'flex', justifyContent: 'center', fontWeight: 800}}>{dateIssued}</div>
              <div style={{ width: 130, height: 1, background: GOLD, margin: '12px auto' }} />
              <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 800, color: NAVY, lineHeight: 1 }}>DATE ISSUED</div>
              {/* <div style={{ fontSize: 15, color: NAVY, marginTop: 6, lineHeight: 1 }}>{dateIssued}</div> */}
            </div>

            <div style={{
              width: 140, height: 140, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(${GOLD}, #f6dfa0, ${GOLD})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8,
              boxSizing: 'border-box',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%', background: NAVY,
                border: `2px solid ${GOLD}`, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', color: '#fff', boxSizing: 'border-box',
              }}>
                <img src="/certificate/mascot.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                <div style={{ fontSize: 8, letterSpacing: 1, fontWeight: 700, marginTop: 6, textAlign: 'center', lineHeight: 1.3 }}>
                  KEEP CODING<br />KEEP GROWING
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', width: 180 }}>
              <img src="/certificate/signature-sapandey.png" alt="Signature" style={{  objectFit: 'contain', mixBlendMode: 'multiply' }} />
              <div style={{ width: 130, height: 1, background: GOLD, margin: '12px auto' }} />
              <div style={{ fontSize: 12, letterSpacing: 1.5, fontWeight: 800, color: NAVY, lineHeight: 1 }}>AARYAN PANDEY</div>
              <div style={{ fontSize: 12, color: '#4a5670', marginTop: 3, lineHeight: 1 }}>Founder & CEO, Bitzy</div>
            </div>
          </div>

          {/* tagline row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 34, fontSize: 13, fontWeight: 700, letterSpacing: 1, color: NAVY, lineHeight: 1 }}>
            <div style={{ width: 50, height: 1, background: GOLD }} />
            <span>{'</>'} LEARN</span>
            <span style={{ color: GOLD }}>•</span>
            <span>BUILD</span>
            <span style={{ color: GOLD }}>•</span>
            <span>PLAY</span>
            <span style={{ color: GOLD }}>•</span>
            <span>GROW</span>
            <div style={{ width: 50, height: 1, background: GOLD }} />
          </div>
        </div>
      </div>
    );
  }
);

CertificateCard.displayName = 'CertificateCard';
export default CertificateCard;