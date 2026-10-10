import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Swords, Star, Zap, Trophy, CheckCircle2,
  ChevronRight, Flame, Target, PlayCircle, Loader2
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useChallenges, useChallengeSolveCounts } from '@/hooks/useDB';
import { useState } from 'react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const difficultyConfig: Record<string, { color: string; bg: string; label: string; barColor: string }> = {
  Easy:   { color: '#58CC02', bg: 'rgba(88,204,2,0.12)', label: 'Easy',   barColor: '#58CC02' },
  Medium: { color: '#FF9600', bg: 'rgba(255,150,0,0.12)', label: 'Medium', barColor: '#FF9600' },
  Hard:   { color: '#FF4B4B', bg: 'rgba(255,75,75,0.12)', label: 'Hard',   barColor: '#FF4B4B' },
};

const categoryIcons: Record<string, string> = {
  Arrays: '📦', Strings: '🔤', Numbers: '🔢',
  'Data Structures': '🗂️', Algorithms: '⚡', 'Dynamic Programming': '🧩',
  Trees: '🌲', Graphs: '🕸️', Math: '➗', Default: '💻',
};

const FILTERS = ['All', 'Easy', 'Medium', 'Hard', 'Unsolved', 'Solved'];

export default function ChallengesPage() {
  const navigate = useNavigate();
  const { hasCompletedChallenge } = useGame();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Real data from Supabase — this used to import a hardcoded legacy dataset,
  // which meant any challenge created in Admin never showed up here at all.
  const { data: challengesData, loading } = useChallenges();
  const { data: solveCounts } = useChallengeSolveCounts(); // real counts from challenge_submissions, never fabricated
  const challenges = challengesData ?? [];

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} />
    </div>
  );

  const solvedCount = challenges.filter((c: any) => hasCompletedChallenge(c.id)).length;
  const totalXP = challenges.filter((c: any) => hasCompletedChallenge(c.id))
    .reduce((sum: number, c: any) => sum + (c.xp_reward ?? 0), 0);
  const progressPct = challenges.length ? Math.round((solvedCount / challenges.length) * 100) : 0;

  const easySolved = challenges.filter((c: any) => c.difficulty === 'Easy' && hasCompletedChallenge(c.id)).length;
  const mediumSolved = challenges.filter((c: any) => c.difficulty === 'Medium' && hasCompletedChallenge(c.id)).length;
  const hardSolved = challenges.filter((c: any) => c.difficulty === 'Hard' && hasCompletedChallenge(c.id)).length;
  const easyTotal = challenges.filter((c: any) => c.difficulty === 'Easy').length;
  const mediumTotal = challenges.filter((c: any) => c.difficulty === 'Medium').length;
  const hardTotal = challenges.filter((c: any) => c.difficulty === 'Hard').length;

  const filtered = challenges.filter((c: any) => {
    const solved = hasCompletedChallenge(c.id);
    const matchFilter =
      filter === 'All' ? true :
      filter === 'Solved' ? solved :
      filter === 'Unsolved' ? !solved :
      c.difficulty === filter;
    const matchSearch = search.trim() === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.category ?? '').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Determine if a challenge is "unlocked" (first unsolved one after last solved)
  const firstUnsolved = challenges.find((c: any) => !hasCompletedChallenge(c.id));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div variants={item} className="text-center pt-1">
        <motion.div
          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1CB0F6, #0C9BDE)', boxShadow: '0 5px 0 #0A86BF' }}
          animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
          <Swords className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Code Arena</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Solve challenges. Earn XP. Level up!</p>
      </motion.div>

      {/* ── Overall progress card ──────────────────────────────────── */}
      <motion.div variants={item} className="d-card p-5"
        style={{ background: 'linear-gradient(135deg, #1CB0F608, #CE82FF08)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-display text-2xl font-black" style={{ color: 'var(--text)' }}>
              {solvedCount}<span className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>/{challenges.length}</span>
            </p>
            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Challenges Solved</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-black" style={{ color: '#FFC800' }}>
              {totalXP.toLocaleString()} XP
            </p>
            <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>Earned from Arena</p>
          </div>
        </div>
        {/* Master progress bar */}
        <div className="h-3 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--surface)' }}>
          <motion.div className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, #1CB0F6, #CE82FF)' }} />
        </div>
        <p className="text-xs text-right font-bold" style={{ color: 'var(--text-muted)' }}>{progressPct}% complete</p>

        {/* Difficulty breakdown */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: 'Easy', solved: easySolved, total: easyTotal, color: '#58CC02', bg: 'rgba(88,204,2,0.12)' },
            { label: 'Medium', solved: mediumSolved, total: mediumTotal, color: '#FF9600', bg: 'rgba(255,150,0,0.12)' },
            { label: 'Hard', solved: hardSolved, total: hardTotal, color: '#FF4B4B', bg: 'rgba(255,75,75,0.12)' },
          ].map(d => (
            <div key={d.label} className="rounded-2xl p-3 text-center" style={{ backgroundColor: d.bg }}>
              <p className="font-display text-base font-black" style={{ color: d.color }}>
                {d.solved}<span className="text-xs font-bold opacity-60">/{d.total}</span>
              </p>
              <p className="text-[10px] font-bold" style={{ color: d.color }}>{d.label}</p>
              <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ backgroundColor: d.color + '30' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${d.total ? (d.solved / d.total) * 100 : 0}%`, backgroundColor: d.color }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Quick stats row ────────────────────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        <div className="d-card p-3 text-center">
          <Target className="w-5 h-5 mx-auto mb-1" style={{ color: '#1CB0F6' }} />
          <p className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>{challenges.length - solvedCount}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Remaining</p>
        </div>
        <div className="d-card p-3 text-center">
          <Flame className="w-5 h-5 mx-auto mb-1" style={{ color: '#FF4B4B' }} />
          <p className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>{hardSolved}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Hard Beaten</p>
        </div>
        <div className="d-card p-3 text-center">
          <Trophy className="w-5 h-5 mx-auto mb-1" style={{ color: '#FFC800' }} />
          <p className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>{progressPct}%</p>
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Complete</p>
        </div>
      </motion.div>

      {/* ── Search ────────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search challenges..."
          className="w-full px-4 py-3 rounded-2xl text-sm border-2 outline-none transition-all"
          style={{
            borderColor: search ? '#1CB0F6' : 'var(--border)',
            backgroundColor: 'var(--white)',
            color: 'var(--text)',
          }} />
      </motion.div>

      {/* ── Filter pills ──────────────────────────────────────────── */}
      <motion.div variants={item} className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-2xl text-xs font-bold border-2 transition-all"
            style={{
              borderColor: filter === f ? '#1CB0F6' : 'var(--border)',
              backgroundColor: filter === f ? '#1CB0F6' : 'var(--white)',
              color: filter === f ? 'white' : 'var(--text-light)',
            }}>
            {f === 'Solved' ? '✅ ' : f === 'Unsolved' ? '⭕ ' : ''}{f}
          </button>
        ))}
      </motion.div>

      {/* ── Result count ─────────────────────────────────────────── */}
      {(search || filter !== 'All') && (
        <motion.p variants={item} className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Showing {filtered.length} challenge{filtered.length !== 1 ? 's' : ''}
        </motion.p>
      )}

      {/* ── Challenge List ────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="d-card p-8 text-center">
            <Swords className="w-10 h-10 mx-auto mb-2" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
            <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>
              {challenges.length === 0 ? 'No challenges published yet' : 'No challenges found'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {challenges.length === 0 ? 'Check back soon!' : 'Try a different filter or search'}
            </p>
          </div>
        ) : filtered.map((challenge: any) => {
          const solved = hasCompletedChallenge(challenge.id);
          const diff = difficultyConfig[challenge.difficulty] ?? difficultyConfig.Easy;
          const isNext = challenge.id === firstUnsolved?.id;
          const catIcon = categoryIcons[challenge.category] ?? categoryIcons.Default;
          const realSolveCount = solveCounts?.[challenge.id] ?? 0;

          return (
            <motion.div key={challenge.id} variants={item} whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/app/challenges/${challenge.slug}`)}
              className="d-card p-0 overflow-hidden cursor-pointer transition-all"
              style={{
                borderColor: solved ? '#58CC0260' : isNext ? '#1CB0F660' : 'var(--border)',
                borderLeftWidth: '4px',
                borderLeftColor: solved ? '#58CC02' : isNext ? '#1CB0F6' : diff.color,
              }}>
              <div className="p-4 flex items-center gap-3.5">
                {/* Icon / Status */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                  style={{ backgroundColor: solved ? 'rgba(88,204,2,0.12)' : isNext ? 'rgba(28,176,246,0.12)' : diff.bg }}>
                  {solved
                    ? <CheckCircle2 className="w-6 h-6" style={{ color: '#58CC02' }} />
                    : isNext
                      ? <PlayCircle className="w-6 h-6" style={{ color: '#1CB0F6' }} />
                      : <span>{catIcon}</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{challenge.title}</p>
                    {isNext && !solved && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold animate-pulse"
                        style={{ backgroundColor: 'rgba(28,176,246,0.12)', color: '#1CB0F6' }}>▶ Next</span>
                    )}
                    {solved && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: 'rgba(88,204,2,0.12)', color: '#58CC02' }}>✓ Solved</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{challenge.category}</p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                      style={{ backgroundColor: diff.bg, color: diff.color }}>{diff.label}</span>
                    <span className="text-[10px] flex items-center gap-1 font-bold" style={{ color: '#FFC800' }}>
                      <Zap className="w-3 h-3" /> {challenge.xp_reward} XP
                    </span>
                    {realSolveCount > 0 && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        👥 {realSolveCount.toLocaleString()} solved
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0">
                  {solved
                    ? <Star className="w-5 h-5" style={{ color: '#58CC02' }} />
                    : <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>

              {/* Solved progress bar at bottom */}
              {solved && (
                <div className="h-1" style={{ backgroundColor: '#58CC02' }} />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Motivational footer ──────────────────────────────────── */}
      {solvedCount > 0 && solvedCount < challenges.length && (
        <motion.div variants={item} className="d-card p-4 text-center"
          style={{ background: 'linear-gradient(135deg, #1CB0F610, #58CC0210)' }}>
          <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
            🔥 Keep going! {challenges.length - solvedCount} challenge{challenges.length - solvedCount !== 1 ? 's' : ''} left to conquer.
          </p>
        </motion.div>
      )}
      {solvedCount === challenges.length && challenges.length > 0 && (
        <motion.div variants={item} className="d-card p-5 text-center"
          style={{ background: 'linear-gradient(135deg, #FFC80020, #FF960020)' }}>
          <Trophy className="w-10 h-10 mx-auto mb-2" style={{ color: '#FFC800' }} />
          <p className="font-display font-bold text-lg" style={{ color: 'var(--text)' }}>Arena Conquered! 🏆</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>You've solved every challenge. Incredible!</p>
        </motion.div>
      )}

      <div className="h-4" />
    </motion.div>
  );
}