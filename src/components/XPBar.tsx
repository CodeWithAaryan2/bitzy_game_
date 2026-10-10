/**
 * src/components/XPBar.tsx
 * Reusable XP/level/coins/streak display. Used in AppLayout (sidebar +
 * mobile header), Dashboard, Profile, Games and Course screens so there's
 * one implementation of the XP math instead of it being recomputed
 * (and previously miscalculated as `xp % 100`) in every screen.
 *
 * variant="compact" — small inline bar for sidebar/navbar
 * variant="full"    — bigger card with numbers + coins + streak, for
 *                      Dashboard/Profile/Games/Course screens
 */
import { motion } from 'framer-motion';
import { Flame, Gem } from 'lucide-react';
import { calculateLevel } from '@/lib/gamification';

interface XPBarProps {
  xp: number;
  coins?: number;
  streak?: number;
  variant?: 'compact' | 'full';
  className?: string;
}

export default function XPBar({ xp, coins, streak, variant = 'full', className = '' }: XPBarProps) {
  const { level, xpInCurrentLevel, xpNeededForNextLevel } = calculateLevel(xp);
  const totalForLevel = xpInCurrentLevel + xpNeededForNextLevel;
  const pct = totalForLevel > 0 ? Math.min(100, Math.round((xpInCurrentLevel / totalForLevel) * 100)) : 100;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="d-progress flex-1 h-2.5">
          <motion.div
            className="d-progress-fill"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[10px] font-bold text-[#58CC02] shrink-0">Lv.{level}</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5 text-sm font-bold" style={{ color: 'var(--text)' }}>
        <span>Level {level} · {xpInCurrentLevel}/{totalForLevel} XP</span>
        <span style={{ color: 'var(--text-muted)' }}>{xpNeededForNextLevel} XP to next</span>
      </div>
      <div className="d-progress h-4">
        <motion.div
          className="d-progress-fill"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {(coins !== undefined || streak !== undefined) && (
        <div className="flex items-center gap-4 mt-2">
          {coins !== undefined && (
            <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#CE82FF' }}>
              <Gem className="w-4 h-4" /> {coins}
            </div>
          )}
          {streak !== undefined && streak > 0 && (
            <div className="flex items-center gap-1 text-sm font-bold" style={{ color: '#FF4B4B' }}>
              <Flame className="w-4 h-4" /> {streak} day streak
            </div>
          )}
        </div>
      )}
    </div>
  );
}
