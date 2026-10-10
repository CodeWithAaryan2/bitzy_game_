import { motion } from 'framer-motion';
import { Lock, Zap, Trophy, Star, Flame, BookOpen, Code, Bug, Timer, Crown,
  Target, Sun, TrendingUp, Rocket, UserCheck, Gamepad2, Coins, Terminal,
  Palette, Braces, Atom, Languages, Moon, HelpCircle, FileCode, Scroll,
  Cpu, Hash, Layers, Coffee } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { achievements } from '@/data/achievements';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Footprints: Star, Flame, BookOpen, Code, Bug, Timer, Crown, Target, Sun,
  TrendingUp, Rocket, UserCheck, Gamepad2, Coins, Terminal, Palette, Braces,
  Atom, Languages, Moon, HelpCircle, FileCode, Trophy, Star, Scroll,
  Zap, Lock, Cpu, Hash, Layers, Coffee,
};

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  learning: { label: 'Learning', color: '#58CC02', emoji: '📚' },
  coding:   { label: 'Coding',   color: '#1CB0F6', emoji: '💻' },
  streak:   { label: 'Streak',   color: '#FF9600', emoji: '🔥' },
  social:   { label: 'Social',   color: '#CE82FF', emoji: '👥' },
  special:  { label: 'Special',  color: '#FF7EB3', emoji: '⭐' },
  course:   { label: 'Courses',  color: '#00C6B6', emoji: '🎓' },
  challenge:{ label: 'Arena',    color: '#FF4B4B', emoji: '⚔️' },
  secret:   { label: 'Secret',   color: '#FFC800', emoji: '🔮' },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const itemAnim = { hidden: { opacity: 0, scale: 0.85, y: 10 }, show: { opacity: 1, scale: 1, y: 0 } };

function BadgeIcon({ iconName, color, size = 'md' }: { iconName: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = ICON_MAP[iconName] || Star;
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Icon className={sizes[size]} style={{ color }} />;
}

export default function AchievementsPage() {
  const { gameState } = useGame();
  const completedIds = new Set(gameState.achievements.filter(a => a.completed).map(a => a.achievement_id));
  const completedCount = completedIds.size;
  const totalCount = achievements.length;
  const completionRate = Math.round((completedCount / totalCount) * 100);

  const categories = [...new Set(achievements.map(a => a.category))];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={itemAnim} className="text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #FFC800, #FF9600)' }}>
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Achievements</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{completedCount} of {totalCount} unlocked</p>
      </motion.div>

      {/* Progress ring */}
      <motion.div variants={itemAnim} className="d-card p-4 flex items-center gap-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="8" />
            <motion.circle cx="40" cy="40" r="34" fill="none" stroke="#FFC800" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - completionRate / 100) }}
              transition={{ duration: 1.4, ease: 'easeOut' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>{completionRate}%</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="font-bold mb-1" style={{ color: 'var(--text)' }}>Badge Collection</p>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            {completedCount === 0 ? 'Complete lessons to earn your first badge!'
             : completedCount < 5 ? 'Great start! Keep going!'
             : completedCount < 15 ? 'You\'re on a roll! 🔥'
             : 'Badge master! 🏆'}
          </p>
          <div className="d-progress h-2.5">
            <motion.div className="d-progress-fill" initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }} transition={{ duration: 1.2 }}
              style={{ background: 'linear-gradient(90deg, #FFC800, #FF9600)' }} />
          </div>
        </div>
      </motion.div>

      {/* Badges by category */}
      {categories.map(cat => {
        const catAchs = achievements.filter(a => a.category === cat);
        const catMeta = CATEGORY_META[cat] || { label: cat, color: '#58CC02', emoji: '🎯' };
        const catCompleted = catAchs.filter(a => completedIds.has(a.id)).length;

        return (
          <motion.div key={cat} variants={itemAnim}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{catMeta.emoji}</span>
                <h2 className="font-display text-base font-bold" style={{ color: 'var(--text)' }}>{catMeta.label}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: catMeta.color + '20', color: catMeta.color }}>
                  {catCompleted}/{catAchs.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {catAchs.map((ach) => {
                const isCompleted = completedIds.has(ach.id);
                const isSecret = ach.isSecret && !isCompleted;

                if (isSecret) {
                  return (
                    <motion.div key={ach.id} variants={itemAnim} whileTap={{ scale: 0.96 }}
                      className="d-card p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden"
                      style={{ opacity: 0.6 }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: 'var(--surface)' }}>
                        <Lock className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>???</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Hidden</p>
                    </motion.div>
                  );
                }

                const catColor = catMeta.color;
                return (
                  <motion.div key={ach.id} variants={itemAnim} whileTap={{ scale: 0.96 }}
                    className="d-card p-4 flex flex-col items-center text-center gap-2 relative overflow-hidden transition-all"
                    style={isCompleted ? {
                      borderColor: catColor + '50',
                      background: `linear-gradient(135deg, ${catColor}08, ${catColor}03)`,
                    } : {}}>

                    {/* Completed glow */}
                    {isCompleted && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ boxShadow: `inset 0 0 20px ${catColor}15` }} />
                    )}

                    {/* Badge icon */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                      style={{
                        background: isCompleted
                          ? `linear-gradient(135deg, ${catColor}30, ${catColor}15)`
                          : 'var(--surface)',
                        border: isCompleted ? `2px solid ${catColor}30` : '2px solid transparent',
                      }}>
                      <BadgeIcon iconName={ach.icon} color={isCompleted ? catColor : 'var(--text-muted)'} size="lg" />
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: catColor, boxShadow: `0 2px 4px ${catColor}60` }}>
                          <span className="text-[8px] text-white font-bold">✓</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold leading-tight"
                        style={{ color: isCompleted ? 'var(--text)' : 'var(--text-muted)' }}>
                        {ach.title}
                      </p>
                      <p className="text-[10px] mt-0.5 leading-tight"
                        style={{ color: 'var(--text-muted)' }}>
                        {ach.description}
                      </p>
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          <Zap className="w-3 h-3" style={{ color: '#FFC800' }} />
                          <span className="text-[10px] font-bold" style={{ color: '#FFC800' }}>+{ach.xpReward}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <span className="text-[10px]">💎</span>
                          <span className="text-[10px] font-bold" style={{ color: '#1CB0F6' }}>+{ach.coinReward}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                        {(ach.requirement?.count ?? 1) > 1
                          ? `${ach.requirement?.count} needed`
                          : 'Not unlocked'}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      <div className="h-4" />
    </motion.div>
  );
}
