import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Calendar, Trophy, CheckCircle2, Lock, Gift } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const WEEKLY_REWARDS = [
  { day: 1, reward: '10 XP', icon: '⚡', color: '#FFC800', unlocked: true },
  { day: 2, reward: '15 XP', icon: '⚡', color: '#FFC800', unlocked: false },
  { day: 3, reward: '20 XP + Badge', icon: '🏅', color: '#FF9600', unlocked: false },
  { day: 4, reward: '25 XP', icon: '⚡', color: '#FFC800', unlocked: false },
  { day: 5, reward: '30 XP', icon: '⚡', color: '#FFC800', unlocked: false },
  { day: 6, reward: '50 XP', icon: '💎', color: '#1CB0F6', unlocked: false },
  { day: 7, reward: '100 XP + 🎁', icon: '🎁', color: '#CE82FF', unlocked: false },
];

const STREAK_MILESTONES = [
  { days: 3, title: 'Warm Up', reward: '150 XP', icon: '🔥', color: '#FF9600', badge: 'On Fire' },
  { days: 7, title: 'Week Warrior', reward: '500 XP + Badge', icon: '⚔️', color: '#FF4B4B', badge: 'Week Warrior' },
  { days: 14, title: 'Two Weeks', reward: '1000 XP', icon: '🏆', color: '#FFC800', badge: 'Fortnight' },
  { days: 30, title: 'Monthly Master', reward: '3000 XP + Avatar', icon: '👑', color: '#CE82FF', badge: 'Monthly Master' },
  { days: 50, title: 'Halfway Hero', reward: '5000 XP', icon: '🌟', color: '#61DAFB', badge: 'Halfway Hero' },
  { days: 100, title: 'Century Coder', reward: '10000 XP + Frame', icon: '💯', color: '#58CC02', badge: 'Century Coder' },
];

const MONTH_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function StreakPage() {
  const { profile } = useAuth();
  const { showXPPopup } = useGame();
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const streak = profile?.current_streak ?? 0;
  const longestStreak = profile?.longest_streak ?? 0;
  const lastLogin = profile?.last_login_date;

  const today = new Date().toISOString().split('T')[0];
  const checkedInToday = lastLogin === today;

  // Simulate which days in the month the user logged in
  const daysLoggedIn = new Set<number>();
  if (streak > 0) {
    const now = new Date();
    for (let i = 0; i < Math.min(streak, 30); i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      daysLoggedIn.add(d.getDate());
    }
  }

  const currentWeekDay = streak % 7 || (streak > 0 ? 7 : 0);

  const nextMilestone = STREAK_MILESTONES.find(m => m.days > streak);

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-5">
      {/* Streak hero */}
      <motion.div variants={I} className="d-card p-6 text-center relative overflow-hidden"
        style={{ background: streak >= 3 ? 'linear-gradient(135deg, #FF6B0020, #FF960020)' : undefined }}>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 text-[120px]">
          🔥
        </div>
        <div className="relative">
          <motion.div
            className="text-7xl font-display font-bold mb-1"
            style={{ color: streak >= 3 ? '#FF4B4B' : '#FFC800' }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            {streak}
          </motion.div>
          <p className="font-display text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>
            {streak === 0 ? 'Start Your Streak!' : `Day Streak 🔥`}
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
            {checkedInToday
              ? '✅ Checked in today! Come back tomorrow!'
              : '⚠️ Log in daily to keep your streak!'}
          </p>

          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="font-display font-bold" style={{ color: '#FFC800' }}>{longestStreak}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Longest</div>
            </div>
            <div className="w-px h-8 self-center" style={{ backgroundColor: 'var(--border)' }} />
            <div className="text-center">
              <div className="font-display font-bold" style={{ color: '#CE82FF' }}>
                {nextMilestone ? nextMilestone.days - streak : '∞'}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {nextMilestone ? 'Days to next milestone' : 'Max reached!'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly reward track */}
      <motion.div variants={I} className="d-card p-4">
        <h2 className="font-display font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: '#FF9600' }} />
          Weekly Rewards
        </h2>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKLY_REWARDS.map((reward, i) => {
            const collected = i < currentWeekDay;
            const isCurrent = i === currentWeekDay - 1;
            return (
              <motion.div
                key={reward.day}
                className="flex flex-col items-center"
                whileHover={{ y: -2 }}
              >
                <div
                  className="w-full aspect-square rounded-2xl flex items-center justify-center text-lg border-2 mb-1"
                  style={{
                    borderColor: collected ? '#58CC02' : isCurrent ? '#FF9600' : 'var(--border)',
                    backgroundColor: collected ? '#F0FFE5' : isCurrent ? '#FFF3E0' : 'var(--surface)',
                    boxShadow: isCurrent ? '0 4px 0 #FF960040' : undefined,
                  }}
                >
                  {collected ? '✅' : reward.icon}
                </div>
                <span className="text-[8px] font-bold text-center" style={{ color: 'var(--text-muted)' }}>
                  Day {reward.day}
                </span>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-3 text-center">
          <p className="text-xs font-bold" style={{ color: '#FF9600' }}>
            {streak > 0 ? `Day ${currentWeekDay} of 7` : 'Log in daily to earn rewards!'}
          </p>
        </div>
      </motion.div>

      {/* Monthly calendar */}
      <motion.div variants={I} className="d-card p-4">
        <h2 className="font-display font-bold mb-3 flex items-center gap-2">
          <Flame className="w-5 h-5" style={{ color: '#FF4B4B' }} />
          This Month
        </h2>
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] font-bold py-1" style={{ color: 'var(--text-muted)' }}>{d}</div>
          ))}
          {MONTH_DAYS.map(day => {
            const logged = daysLoggedIn.has(day);
            const isToday = day === new Date().getDate();
            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.1 }}
                className="aspect-square rounded-xl flex items-center justify-center text-[11px] font-bold"
                style={{
                  backgroundColor: logged ? '#FF4B4B' : isToday ? 'var(--surface)' : 'transparent',
                  color: logged ? 'white' : isToday ? '#FF4B4B' : 'var(--text-muted)',
                  border: isToday && !logged ? '2px solid #FF4B4B' : 'none',
                }}
              >
                {logged ? '🔥' : day}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Streak milestones */}
      <motion.div variants={I} className="space-y-2">
        <h2 className="font-display font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: '#FFC800' }} />
          Streak Milestones
        </h2>
        {STREAK_MILESTONES.map(milestone => {
          const reached = streak >= milestone.days;
          const isNext = milestone === nextMilestone;
          const progress = Math.min(100, (streak / milestone.days) * 100);
          return (
            <motion.div
              key={milestone.days}
              className="d-card p-3"
              style={{
                borderColor: reached ? milestone.color : isNext ? milestone.color + '40' : 'var(--border)',
                backgroundColor: reached ? milestone.color + '10' : 'var(--white)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{milestone.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-bold text-sm">{milestone.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: milestone.color + '20', color: milestone.color }}>
                      {milestone.days} days
                    </span>
                    {reached && <CheckCircle2 className="w-4 h-4" style={{ color: '#58CC02' }} />}
                    {!reached && !isNext && <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                  </div>
                  {isNext && (
                    <div className="d-progress h-2">
                      <motion.div
                        className="d-progress-fill"
                        style={{ backgroundColor: milestone.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: milestone.color }}>{milestone.reward}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Streak restore */}
      {streak === 0 && longestStreak > 0 && (
        <motion.div variants={I} className="d-card d-card-orange p-4 text-center">
          <Gift className="w-8 h-8 mx-auto mb-2" style={{ color: '#FF9600' }} />
          <h3 className="font-display font-bold mb-1">Restore Your Streak? 🔥</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            Your streak broke! Use 50 gems to restore it and keep your momentum.
          </p>
          <button
            onClick={() => setShowRestoreModal(true)}
            className="d-btn d-btn-orange d-btn-sm"
          >
            Restore for 50 💎
          </button>
        </motion.div>
      )}

      {/* Restore modal */}
      <AnimatePresence>
        {showRestoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowRestoreModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="d-card w-full max-w-sm text-center p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-5xl mb-3">🔥</div>
              <h3 className="font-display text-xl font-bold mb-2">Restore Streak</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Spend 50 💎 gems to restore your streak and protect your progress!
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowRestoreModal(false)}
                  className="flex-1 d-btn d-btn-ghost d-btn-md">Cancel</button>
                <button
                  className="flex-1 d-btn d-btn-orange d-btn-md"
                  onClick={() => {
                    showXPPopup(0, 'coin', '🔥 Streak restored! Keep going!');
                    setShowRestoreModal(false);
                  }}
                >
                  Restore 🔥
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}