/**
 * src/components/AppTour.tsx
 *
 * v3 tour — fixes two real bugs from before and adds coverage for every
 * feature shipped since the last tour was written:
 *
 * 1. MOBILE WAS COMPLETELY BROKEN. The desktop sidebar (`.d-sidebar`) is
 *    `display:none` below 1024px, so every `data-tour` target the old tour
 *    used lived inside it — on mobile, getBoundingClientRect() on a
 *    display:none element returns an all-zero rect, collapsing the
 *    spotlight to nothing. Fixed by giving the mobile header/bottom-nav/More
 *    button their OWN matching `data-tour` attributes, and having this file
 *    pick whichever matching element is actually visible right now.
 *
 * 2. Desktop shows every nav item directly; mobile hides most of them behind
 *    a "More" drawer that isn't even in the DOM until opened. So mobile and
 *    desktop need genuinely different step lists, not just repositioned
 *    tooltips — mobile gets 5 direct nav steps + one consolidated "More"
 *    step, desktop gets a full item-by-item walkthrough.
 *
 * New content: World Map, Boss Battle, Certificates, Code Race (mentioned
 * under Play), dark mode toggle, and the mobile More button.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { speak, stopSpeaking } from '@/lib/tts';

export const TOUR_KEY = 'bitzy_tour_done_v3';

interface TourStep {
  target: string; // data-tour="xxx"
  title: string;
  body: string;
  emoji: string;
}

// ───────────────────────── Desktop: full item-by-item walkthrough ─────────────────────────
const DESKTOP_STEPS: TourStep[] = [
  { target: 'logo', emoji: '🤖', title: "Hey, I'm Bitzy! 👋", body: "Your AI-powered coding buddy. I'll show you around. Tap me anytime to replay this tour!" },
  { target: 'nav-learn', emoji: '🏠', title: 'Learn — Your Home Base', body: 'Start here every day. XP, streak 🔥, hearts ❤️, and your daily goals all live here.' },
  { target: 'nav-courses', emoji: '📚', title: 'Courses — Structured Paths', body: 'Pick a track and go lesson by lesson. Finish a course and download an auto-generated certificate with your name on it 🎓.' },
  // { target: 'nav-world-map', emoji: '🗺️', title: 'World Map — Visual Journey', body: 'See your entire learning path laid out as a map. Track where you\'ve been and what\'s unlocking next.' },
  { target: 'nav-play', emoji: '🎮', title: 'Play — Games That Teach', body: 'Quiz battles, bug hunts, speed typing, fill-the-blank, and more. Look for Code Race — race friends live in real time!' },
  { target: 'nav-arena', emoji: '⚔️', title: 'Arena — Prove Yourself', body: 'Coding challenges sorted by difficulty. Solve them to earn badges and climb the ranks.' },
  // { target: 'nav-boss-battle', emoji: '💀', title: 'Boss Battle — Big Tests', body: 'Tougher, timed challenges that check everything you\'ve learned so far. Not for the faint of heart.' },
  { target: 'nav-league', emoji: '🏆', title: 'League — Global Rankings', body: 'Compete with coders worldwide. Earn XP daily to climb the leaderboard and hold your spot.' },
  { target: 'nav-badges', emoji: '⭐', title: 'Badges — Your Trophy Room', body: 'Unlock achievements for streaks, milestones, and mastery. Every badge tells a story.' },
  { target: 'nav-ai-mentor', emoji: '✨', title: 'Sub AI — Your Mentor', body: 'Stuck? Ask anything. Explains concepts, debugs code, motivates you — Hinglish supported 😄' },
  { target: 'nav-certificates', emoji: '🎓', title: 'Certificates — NEW', body: 'Every completed course unlocks a real, downloadable certificate with your name and the course name auto-filled in.' },
  { target: 'theme-toggle', emoji: '🌗', title: 'Light or Dark — Your Call', body: 'Switch themes anytime. Everything adapts, day or night.' },
  { target: 'logo', emoji: '🚀', title: "You're Ready! 🚀", body: 'Start a lesson, play a game, or take on a challenge. Your coding journey begins now. Go get that XP!' },
];

// ───────────────────────── Mobile: bottom-nav items + one consolidated "More" step ─────────────────────────
const MOBILE_STEPS: TourStep[] = [
  { target: 'logo', emoji: '🤖', title: "Hey, I'm Bitzy! 👋", body: "Your AI-powered coding buddy. Tap me anytime to replay this tour!" },
  { target: 'nav-learn', emoji: '🏠', title: 'Learn — Your Home Base', body: 'Start here every day. XP, streak 🔥, hearts ❤️, and your daily goals all live here.' },
  { target: 'nav-courses', emoji: '📚', title: 'Courses — Structured Paths', body: 'Pick a track and go lesson by lesson. Finish a course and download an auto-generated certificate with your name on it 🎓.' },
  { target: 'nav-play', emoji: '🎮', title: 'Play — Games That Teach', body: 'Quiz battles, bug hunts, speed typing, and more. Look for Code Race — race friends live in real time!' },
  { target: 'nav-arena', emoji: '⚔️', title: 'Arena — Prove Yourself', body: 'Coding challenges sorted by difficulty. Solve them to earn badges and climb the ranks.' },
  { target: 'nav-league', emoji: '🏆', title: 'League — Global Rankings', body: 'Compete with coders worldwide. Earn XP daily to climb the leaderboard.' },
  { target: 'nav-more', emoji: '➕', title: 'More — Everything Else', body: 'Tap here for World Map, Boss Battle, Badges, AI Mentor, Certificates 🎓, Community, Skill Tree, and more.' },
  { target: 'theme-toggle', emoji: '🌗', title: 'Light or Dark — Your Call', body: 'Switch themes anytime. Everything adapts, day or night.' },
  { target: 'logo', emoji: '🚀', title: "You're Ready! 🚀", body: 'Start a lesson, play a game, or take on a challenge. Your coding journey begins now. Go get that XP!' },
];

const COLORS = ['#2B7FFF', '#58CC02', '#FF9600', '#1CB0F6', '#FF4B4B', '#7C3AED', '#FF4B4B', '#FFC800', '#CE82FF', '#00C6B6', '#58CC02', '#1CB0F6', '#FF6B6B'];
const BG_GRADIENTS = [
  'linear-gradient(135deg, #EBF2FF 0%, #F0F8FF 100%)',
  'linear-gradient(135deg, #F0FFE5 0%, #F5FFF0 100%)',
  'linear-gradient(135deg, #FFF8E0 0%, #FFFBF0 100%)',
  'linear-gradient(135deg, #E8F9FF 0%, #F0FDFF 100%)',
  'linear-gradient(135deg, #FFE8E8 0%, #FFF0F0 100%)',
  'linear-gradient(135deg, #F5E8FF 0%, #FAF0FF 100%)',
  'linear-gradient(135deg, #FFE8E8 0%, #FFF0F0 100%)',
  'linear-gradient(135deg, #FFFBF0 0%, #FFFEFC 100%)',
  'linear-gradient(135deg, #F5E8FF 0%, #FAF0FF 100%)',
  'linear-gradient(135deg, #E8FDF5 0%, #F0FFFA 100%)',
  'linear-gradient(135deg, #F0FFE5 0%, #F5FFF0 100%)',
  'linear-gradient(135deg, #E8F9FF 0%, #F0FDFF 100%)',
  'linear-gradient(135deg, #FFE8F0 0%, #FFF0F5 100%)',
];

interface Rect { top: number; left: number; width: number; height: number; }

// Multiple elements can share the same data-tour value (desktop sidebar +
// mobile header/nav both render simultaneously in the DOM, one hidden via
// CSS). Pick the one that's actually visible right now — offsetParent is
// null for display:none elements (and their descendants), which is exactly
// what `.d-sidebar` / `.lg:hidden` toggle between breakpoints.
function findVisibleTarget(target: string): HTMLElement | null {
  const els = document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`);
  for (const el of Array.from(els)) {
    if (el.offsetParent !== null) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return el;
    }
  }
  return null;
}

function rectOf(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

// The target might be scrolled out of view — inside the desktop sidebar's
// own scroll container (18 nav items can overflow it), inside the page
// body, or just below the fold on a long page. scrollIntoView handles ALL
// of those (including nested scroll containers) automatically, but it's
// asynchronous with no completion callback — so poll the element's rect
// on every frame until it stops moving for a couple frames in a row, then
// resolve. Bails out after ~1s regardless so the tour never hangs.
function scrollToTarget(el: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    let last = -1, stableFrames = 0, totalFrames = 0;
    const check = () => {
      const top = el.getBoundingClientRect().top;
      if (Math.abs(top - last) < 0.5) stableFrames++; else stableFrames = 0;
      last = top;
      totalFrames++;
      if (stableFrames >= 3 || totalFrames > 60) { resolve(); return; }
      requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });
}

const PAD = 16; // spotlight padding
const DESKTOP_BREAKPOINT = 1024;

export default function AppTour({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false); // true once scroll-into-view has settled for this step
  const [voiceOn, setVoiceOn] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < DESKTOP_BREAKPOINT);
  const [tooltipH, setTooltipH] = useState(240); // replaced with real measured height after first render of each step
  const cardRef = useRef<HTMLDivElement>(null);
  const measureToken = useRef(0);

  const STEPS = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;
  const cur = STEPS[step];
  const color = COLORS[step % COLORS.length];
  const bg = BG_GRADIENTS[step % BG_GRADIENTS.length];
  const isLast = step === STEPS.length - 1;

  // Scroll the target into view (handles nested scroll containers like the
  // sidebar's own overflow-y-auto, and normal page scroll alike), wait for
  // the scroll to actually finish, THEN measure — this is what makes the
  // tour work for anything currently off-screen instead of just snapping a
  // spotlight to wherever the element happens to sit before scrolling.
  const measureRect = useCallback(() => {
    const token = ++measureToken.current;
    setReady(false);
    const el = findVisibleTarget(cur.target);
    if (!el) { setRect(null); setReady(true); return; }
    scrollToTarget(el).then(() => {
      if (token !== measureToken.current) return; // a newer step/resize superseded this one
      setRect(rectOf(el));
      setReady(true);
    });
  }, [cur.target]);

  useEffect(() => {
    if (!visible) { stopSpeaking(); return; }
    setStep(0);
    setIsMobile(window.innerWidth < DESKTOP_BREAKPOINT);
  }, [visible]);

  // If the viewport crosses the mobile/desktop breakpoint mid-tour (e.g.
  // rotating a tablet, resizing a browser window), re-check which step list
  // applies and clamp the current step so it doesn't go out of bounds.
  useEffect(() => {
    if (!visible) return;
    let debounceTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      const mobileNow = window.innerWidth < DESKTOP_BREAKPOINT;
      setIsMobile(prev => {
        if (prev !== mobileNow) setStep(s => Math.min(s, (mobileNow ? MOBILE_STEPS.length : DESKTOP_STEPS.length) - 1));
        return mobileNow;
      });
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(measureRect, 120);
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(debounceTimer); };
  }, [visible, measureRect]);

  useEffect(() => {
    if (!visible) return;
    // A short delay before the very first measure of a step lets any exit
    // animation (e.g. closing the mobile More drawer from the previous
    // step) finish, so scrollIntoView doesn't fight a layout that's still
    // shifting under it.
    const t = setTimeout(measureRect, 60);
    return () => clearTimeout(t);
  }, [visible, measureRect, step]);

  // Measure the tooltip card's REAL rendered height (once its content is in
  // the DOM) instead of guessing a fixed number — this is what keeps the
  // positioning accurate across the very different body lengths between
  // steps and across narrow phone widths where text wraps to more lines.
  useEffect(() => {
    if (!cardRef.current) return;
    const ro = new ResizeObserver(entries => {
      const h = entries[0]?.contentRect.height;
      if (h) setTooltipH(h);
    });
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [step, isMobile]);

  // speak — uses native TTS on Capacitor (Android WebView's speechSynthesis
  // is unreliable/silent), falls back to Web Speech API in a real browser.
  useEffect(() => {
    if (!visible || !voiceOn) return;
    speak(`${cur.title}. ${cur.body}`, { rate: 1.05, pitch: 1.1 });
  }, [step, visible, voiceOn, cur]);

  const go = (dir: 1 | -1) => {
    stopSpeaking();
    const next = step + dir;
    if (next < 0) return;
    if (next >= STEPS.length) { done(); return; }
    setStep(next);
  };

  const done = () => {
    stopSpeaking();
    localStorage.setItem(TOUR_KEY, '1');
    onClose();
  };

  // Tooltip position relative to spotlight rect — clamped to viewport on
  // all sides, with a narrower card + smaller side-gaps on small screens so
  // it never overflows a phone-width viewport.
  const tooltipStyle = (): React.CSSProperties => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(vw - 24, isMobile ? 300 : 320);
    // using measured tooltipH state instead of a fixed guess
    const gap = isMobile ? 10 : 12;

    if (!rect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: cardW };
    }

    const spTop = rect.top - PAD;
    const spLeft = rect.left - PAD;
    const spRight = rect.left + rect.width + PAD;
    const spBottom = rect.top + rect.height + PAD;

    // On mobile, targets are usually along the very top or very bottom edge
    // (header / bottom nav), so prefer stacking above/below rather than
    // beside — there's rarely enough horizontal room next to a bottom-tab.
    if (isMobile) {
      if (spBottom + tooltipH + gap < vh) {
        return { position: 'fixed', top: spBottom + gap, left: Math.max(12, Math.min(rect.left, vw - cardW - 12)), width: cardW };
      }
      return { position: 'fixed', top: Math.max(12, spTop - tooltipH - gap), left: Math.max(12, Math.min(rect.left, vw - cardW - 12)), width: cardW };
    }

    // Desktop: try right, then left, then bottom, then top.
    if (spRight + cardW + gap < vw) {
      return { position: 'fixed', top: Math.max(12, Math.min(spTop, vh - tooltipH - 12)), left: spRight + gap, width: cardW };
    }
    if (spLeft - cardW - gap > 0) {
      return { position: 'fixed', top: Math.max(12, Math.min(spTop, vh - tooltipH - 12)), left: spLeft - cardW - gap, width: cardW };
    }
    if (spBottom + tooltipH + gap < vh) {
      return { position: 'fixed', top: spBottom + gap, left: Math.max(12, Math.min(rect.left, vw - cardW - 12)), width: cardW };
    }
    return { position: 'fixed', top: Math.max(12, spTop - tooltipH - gap), left: Math.max(12, Math.min(rect.left, vw - cardW - 12)), width: cardW };
  };

  const arrowDir = (): 'left' | 'right' | 'up' | 'down' | null => {
    if (!rect) return null;
    const vw = window.innerWidth;
    if (isMobile) {
      const spBottom = rect.top + rect.height + PAD;
      const vh = window.innerHeight;
      return spBottom + tooltipH < vh ? 'up' : 'down';
    }
    const spRight = rect.left + rect.width + PAD;
    const spLeft = rect.left - PAD;
    if (spRight + 340 < vw) return 'left';
    if (spLeft > 340) return 'right';
    return 'up';
  };

  const arrow = arrowDir();
  const ts = tooltipStyle();

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Dark overlay with spotlight cutout via SVG mask */}
          <motion.div
            key="tour-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none' }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <mask id="tour-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {rect && (
                    <motion.rect
                      key={`spot-${step}-${isMobile}`}
                      animate={{
                        x: rect.left - PAD,
                        y: rect.top - PAD,
                        width: rect.width + PAD * 2,
                        height: rect.height + PAD * 2,
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      rx={16}
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(10,15,30,0.78)" mask="url(#tour-mask)" />
            </svg>

            {/* Spotlight glowing border */}
            {rect && (
              <motion.div
                key={`glow-${step}-${isMobile}`}
                animate={{
                  top: rect.top - PAD - 2,
                  left: rect.left - PAD - 2,
                  width: rect.width + PAD * 2 + 4,
                  height: rect.height + PAD * 2 + 4,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{
                  position: 'absolute',
                  borderRadius: 18,
                  border: `2.5px solid ${color}`,
                  boxShadow: `0 0 0 4px ${color}22, 0 0 24px 4px ${color}44`,
                  pointerEvents: 'none',
                }}
              />
            )}
          </motion.div>

          {/* Clickable backdrop (skip) */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 9991 }} onClick={done} />

          {/* Tooltip card */}
          <motion.div
            key={`card-${step}-${isMobile}`}
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            style={{ ...ts, zIndex: 9999, maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Arrow pointer */}
            {arrow && (
              <div style={{
                position: 'absolute',
                ...(arrow === 'left' ? { left: -10, top: 28, borderRight: `10px solid ${color}`, borderTop: '8px solid transparent', borderBottom: '8px solid transparent' } :
                   arrow === 'right' ? { right: -10, top: 28, borderLeft: `10px solid ${color}`, borderTop: '8px solid transparent', borderBottom: '8px solid transparent' } :
                   arrow === 'up' ? { top: -10, left: 32, borderBottom: `10px solid ${color}`, borderLeft: '8px solid transparent', borderRight: '8px solid transparent' } :
                   { bottom: -10, left: 32, borderTop: `10px solid ${color}`, borderLeft: '8px solid transparent', borderRight: '8px solid transparent' }),
              }} />
            )}

            <div ref={cardRef} style={{ borderRadius: 24, overflow: 'hidden', boxShadow: `0 20px 60px rgba(0,0,0,0.25), 0 0 0 2px ${color}` }}>
              {/* Colored header strip */}
              <div style={{ background: `linear-gradient(135deg, ${color}EE 0%, ${color}BB 100%)`, padding: '16px 18px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{cur.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Step {step + 1} of {STEPS.length}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginTop: 1 }}>
                        {cur.title}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { setVoiceOn(v => !v); }} style={{ width: 30, height: 30, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      {voiceOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                    <button onClick={done} style={{ width: 30, height: 30, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div style={{ background: bg, padding: '14px 18px 16px' }}>
                <p style={{ fontSize: 13.5, lineHeight: 1.55, color: '#374151', margin: 0 }}>{cur.body}</p>

                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 5, margin: '12px 0 14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ width: i === step ? 20 : 6, opacity: i <= step ? 1 : 0.35 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      style={{ height: 6, borderRadius: 3, background: i < step ? color : i === step ? color : '#CBD5E1', flexShrink: 0 }}
                    />
                  ))}
                </div>

                {/* Nav buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {step > 0 && (
                    <button onClick={() => go(-1)} disabled={!ready} style={{ flex: '0 0 auto', padding: '10px 14px', borderRadius: 14, border: `2px solid ${color}33`, background: 'transparent', cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.5, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#6B7280' }}>
                      <ChevronLeft size={15} /> Back
                    </button>
                  )}
                  <button onClick={() => go(1)} disabled={!ready} style={{ flex: 1, padding: '10px 0', borderRadius: 14, border: 'none', background: color, boxShadow: `0 4px 0 ${color}88`, cursor: ready ? 'pointer' : 'default', opacity: ready ? 1 : 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#fff' }}>
                    {isLast ? "Let's Go! 🚀" : 'Next'} {!isLast && <ChevronRight size={15} />}
                  </button>
                </div>

                {!isLast && (
                  <button onClick={done} style={{ width: '100%', marginTop: 8, padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, color: '#9CA3AF', fontWeight: 600 }}>
                    Skip tour
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}