/**
 * src/components/BadgeShowcase.tsx
 *
 * Redesigned "Badges" section — a glowing progress ring + a shelf of
 * badge tiles (soft radial glow per badge color, shine sweep, spring
 * pop-in), instead of the old plain scrollable row of flat squares.
 * Shared by ProfilePage (own profile, clickable → full achievements
 * page) and PublicProfilePage (someone else's profile, tiles are
 * inert — no navigation).
 */
import { motion } from 'framer-motion';
import type { Achievement } from '@/types';

const ICON_EMOJI: Record<string, string> = {
  Footprints: '👣', Flame: '🔥', BookOpen: '📖', HelpCircle: '❓', Target: '🎯',
  Moon: '🌙', Rocket: '🚀', Trophy: '🏆', Terminal: '💻', Bug: '🐛',
  Code: '💡', Zap: '⚡', Timer: '⏱️', Languages: '🌐', Sun: '☀️',
  Star: '⭐', Award: '🏅', Shield: '🛡️', Heart: '❤️', Crown: '👑',
};

export default function BadgeShowcase({
  earnedAchievements,
  totalCount,
  title = '🏅 Badges',
  onViewAll,
  onBadgeClick,
  emptyLabel = 'No badges yet',
  emptySubLabel = 'Complete lessons and challenges to earn badges!',
  maxTiles = 8,
}: {
  earnedAchievements: Achievement[]; // most-recent-first
  totalCount: number; // size of the full achievement catalog, for the ring
  title?: string;
  onViewAll?: () => void;
  onBadgeClick?: (a: Achievement) => void;
  emptyLabel?: string;
  emptySubLabel?: string;
  maxTiles?: number;
}) {
  const earnedCount = earnedAchievements.length;
  const pct = totalCount > 0 ? Math.min((earnedCount / totalCount) * 100, 100) : 0;
  const shown = earnedAchievements.slice(0, maxTiles);
  const extra = earnedCount - shown.length;

  // Progress ring geometry
  const r = 15.5;
  const circumference = 2 * Math.PI * r;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Progress ring showing earned/total across the whole catalog */}
          <div className="relative w-9 h-9 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-9 h-9 -rotate-90">
              <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
              <motion.circle
                cx="18" cy="18" r={r} fill="none" stroke="url(#badgeRingGradient)" strokeWidth="4"
                strokeLinecap="round" strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              />
              <defs>
                <linearGradient id="badgeRingGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFC800" />
                  <stop offset="100%" stopColor="#FF9600" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color: '#FF9600' }}>
              {Math.round(pct)}%
            </span>
          </div>
          <h2 className="font-display font-bold">{title} ({earnedCount})</h2>
        </div>
        {onViewAll && (
          <button onClick={onViewAll} className="text-xs font-bold" style={{ color: '#2B7FFF' }}>
            View all →
          </button>
        )}
      </div>

      {earnedCount === 0 ? (
        <div className="d-card text-center py-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ background: 'radial-gradient(circle at 50% 0%, #FFC800, transparent 70%)' }} />
          <div className="relative text-4xl mb-2">🏅</div>
          <p className="relative text-sm font-bold" style={{ color: 'var(--text)' }}>{emptyLabel}</p>
          <p className="relative text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{emptySubLabel}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {shown.map((ach, i) => (
            <motion.button
              key={ach.id}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: i * 0.05 }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onBadgeClick?.(ach)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-[28px] overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 30% 25%, ${ach.color}45, ${ach.color}18 60%, ${ach.color}0a)`,
                  border: `1.5px solid ${ach.color}55`,
                  boxShadow: `0 4px 14px -4px ${ach.color}80, inset 0 1px 0 0 ${ach.color}30`,
                }}
              >
                {/* diagonal shine sweep on hover */}
                <div
                  className="absolute -inset-x-6 -top-2 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 48%, transparent 65%)',
                    transform: 'translateX(-30%)',
                  }}
                />
                <span className="relative drop-shadow-sm">{ICON_EMOJI[ach.icon] ?? '🏅'}</span>
              </div>
              <p className="text-[9px] font-bold text-center leading-tight line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                {ach.title}
              </p>
            </motion.button>
          ))}

          {extra > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: shown.length * 0.05 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={onViewAll}
              className="flex flex-col items-center gap-1.5"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-sm"
                style={{ backgroundColor: 'var(--surface)', border: '1.5px dashed var(--border)', color: 'var(--text-muted)' }}>
                +{extra}
              </div>
              <p className="text-[9px] font-bold text-center" style={{ color: 'var(--text-muted)' }}>more</p>
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
