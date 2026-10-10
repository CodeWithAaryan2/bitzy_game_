import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Share2, Trophy, Zap, Flame, BookOpen, ExternalLink, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { achievements as achData } from '@/data/achievements';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const I = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

// ── static metadata (no DB needed) ───────────────────────────
const COURSE_META: Record<number, { title: string; emoji: string; color: string }> = {
  1: { title: 'HTML',        emoji: '🌐', color: '#E34C26' },
  2: { title: 'CSS',         emoji: '🎨', color: '#264DE4' },
  3: { title: 'JavaScript',  emoji: '⚡', color: '#F7DF1E' },
  4: { title: 'React',       emoji: '⚛️', color: '#61DAFB' },
  5: { title: 'Python',      emoji: '🐍', color: '#3776AB' },
  6: { title: 'TypeScript',  emoji: '📘', color: '#3178C6' },
  7: { title: 'Node.js',     emoji: '🟢', color: '#68A063' },
  8: { title: 'SQL',         emoji: '🗄️', color: '#FF9600' },
  9: { title: 'Git',         emoji: '🔀', color: '#F05032' },
  10:{ title: 'DSA',         emoji: '📊', color: '#CE82FF' },
};

const PROJECT_META: Record<string, { title: string; emoji: string; tech: string[]; color: string; desc: string }> = {
  portfolio:  { title: 'Portfolio Website', emoji: '🌐', tech: ['HTML','CSS'],          color: '#E34C26', desc: 'Personal dev portfolio' },
  calculator: { title: 'Calculator App',    emoji: '🔢', tech: ['JS','CSS'],            color: '#F7DF1E', desc: 'Fully functional calculator' },
  weather:    { title: 'Weather App',       emoji: '🌤️', tech: ['JS','API'],            color: '#1CB0F6', desc: 'Real-time weather from API' },
  todo:       { title: 'Todo App',          emoji: '✅', tech: ['React','Hooks'],       color: '#61DAFB', desc: 'React task manager' },
  chat:       { title: 'Real-time Chat',    emoji: '💬', tech: ['React','Supabase'],    color: '#3ECF8E', desc: 'Full-stack chat app' },
};

const ICON_EMOJI: Record<string, string> = {
  Footprints:'👣', Flame:'🔥', BookOpen:'📖', HelpCircle:'❓', Target:'🎯',
  Moon:'🌙', Rocket:'🚀', Trophy:'🏆', Terminal:'💻', Bug:'🐛',
  Code:'💡', Zap:'⚡', Timer:'⏱️', Languages:'🌐', Sun:'☀️',
  Star:'⭐', Award:'🏅', Shield:'🛡️', Heart:'❤️', Crown:'👑',
};

const skillLevel = (p: number) =>
  p >= 100 ? { label: 'Master', w: 100 } : p >= 75 ? { label: 'Advanced', w: p } :
  p >= 40  ? { label: 'Mid', w: p }      : p >= 10 ? { label: 'Beginner', w: p } : null;

function getStorage(key: string, fallback: any) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}

type Tab = 'skills' | 'projects' | 'certs' | 'badges';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'skills',    label: 'Skills',    emoji: '⚡' },
  { id: 'projects',  label: 'Projects',  emoji: '🛠️' },
  { id: 'certs',     label: 'Certs',     emoji: '📜' },
  { id: 'badges',    label: 'Badges',    emoji: '🏅' },
];

// ── component ─────────────────────────────────────────────────
export default function PortfolioPage() {
  const navigate  = useNavigate();
  const { profile } = useAuth();
  const { gameState } = useGame();
  const [copied, setCopied]     = useState(false);
  const [tab, setTab]           = useState<Tab>('skills');

  const name    = profile?.display_name ?? 'Learner';
  const bio     = profile?.bio ?? 'Learning to code one day at a time 🚀';
  const avatar  = profile?.avatar;
  const level   = profile?.level ?? 1;
  const xp      = profile?.xp ?? 0;
  const streak  = profile?.current_streak ?? 0;

  const cp           = gameState.courseProgress ?? [];
  const userAchs     = gameState.achievements ?? [];
  const submissions  = gameState.submissions ?? [];

  const completedCourses    = cp.filter((c: any) => c.overall_progress >= 100).length;
  const solvedChallenges    = submissions.filter((s: any) => s.status === 'accepted').length;
  const totalLessons        = cp.reduce((s: number, c: any) => s + (c.completed_lessons?.length ?? 0), 0);

  const earnedAchs = userAchs
    .filter((a: any) => a.completed)
    .map((a: any) => achData.find((ad: any) => ad.id === a.achievement_id))
    .filter(Boolean) as typeof achData;

  const skills = Object.entries(COURSE_META).map(([idStr, meta]) => {
    const id = Number(idStr);
    const prog = cp.find((p: any) => p.course_id === id)?.overall_progress ?? 0;
    const lvl = skillLevel(prog);
    return lvl ? { id, ...meta, ...lvl, prog } : null;
  }).filter(Boolean) as any[];

  const certs = Object.entries(COURSE_META).map(([idStr, meta]) => {
    const id = Number(idStr);
    const prog = cp.find((p: any) => p.course_id === id)?.overall_progress ?? 0;
    return { id, ...meta, earned: prog >= 100, prog };
  }).filter(c => c.prog > 0);

  const doneProjects    = getStorage('bitzy_completed_projects', []) as string[];
  const progressRaw     = getStorage('bitzy_project_progress_v2', {});
  const startedProjects = Object.keys(progressRaw).filter(k => (progressRaw[k]?.length ?? 0) > 0);
  const projects = Object.entries(PROJECT_META).map(([id, meta]) => ({
    id, ...meta, done: doneProjects.includes(id), started: startedProjects.includes(id),
  })).filter(p => p.done || p.started);

  const profileUrl = `https://bitzy.app/p/${name.toLowerCase().replace(/\s+/g, '-')}`;
  const copy = () => { navigator.clipboard.writeText(profileUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  // gradient built from top skills
  const topColor = skills[0]?.color ?? '#58CC02';
  const secColor = skills[1]?.color ?? '#1CB0F6';

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="pb-10 space-y-0">

      {/* ── Hero banner ───────────────────────────────────────── */}
      <motion.div variants={I} className="relative overflow-hidden rounded-3xl mb-4"
        style={{ background: `linear-gradient(135deg, ${topColor}22 0%, ${secColor}22 100%)`, border: `2px solid ${topColor}30` }}>

        {/* Decorative dots */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: `radial-gradient(circle, ${topColor}18 1.5px, transparent 1.5px)`, backgroundSize: '22px 22px' }}/>

        {/* Top row: share */}
        <div className="relative flex justify-end p-4 pb-0">
          <motion.button whileTap={{ scale: 0.92 }} onClick={copy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor: topColor + '20', color: topColor }}>
            {copied ? <Check size={12}/> : <Share2 size={12}/>}
            {copied ? 'Copied!' : 'Share'}
          </motion.button>
        </div>

        {/* Avatar + name */}
        <div className="relative px-5 pt-2 pb-5">
          <div className="flex items-end gap-4 mb-3">
            {/* Avatar */}
            <motion.div whileHover={{ scale: 1.06 }}
              className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl font-black border-4 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${topColor}, ${secColor})`, color: 'white', borderColor: 'var(--white)' }}>
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full rounded-2xl object-cover"/>
                : name[0]?.toUpperCase()}
            </motion.div>

            {/* Name / handle */}
            <div className="pb-1">
              <h1 className="font-display text-2xl font-black leading-none" style={{ color: 'var(--text)' }}>{name}</h1>
              <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                @{name.toLowerCase().replace(/\s+/g, '')}
              </p>
              {/* Level badge */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full text-white"
                  style={{ background: `linear-gradient(90deg, ${topColor}, ${secColor})` }}>
                  Lv {level}
                </span>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                  {xp.toLocaleString()} XP
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>{bio}</p>

          {/* Stat pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { icon: Flame,    val: `${streak} day streak`, color: '#FF4B4B' },
              { icon: BookOpen, val: `${totalLessons} lessons`,  color: '#1CB0F6' },
              { icon: Trophy,   val: `${completedCourses} courses`, color: '#FFC800' },
              { icon: Zap,      val: `${solvedChallenges} solved`,  color: '#58CC02' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.val} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: s.color + '15', color: s.color }}>
                  <Icon size={12}/>{s.val}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Tab bar ───────────────────────────────────────────── */}
      <motion.div variants={I} className="flex gap-1 mb-4 p-1 rounded-2xl" style={{ backgroundColor: 'var(--surface)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
            style={{
              backgroundColor: tab === t.id ? 'var(--white)' : 'transparent',
              color: tab === t.id ? topColor : 'var(--text-muted)',
              boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </motion.div>

      {/* ── Tab content ───────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* SKILLS */}
          {tab === 'skills' && (
            <div className="space-y-2">
              {skills.length === 0 ? (
                <Empty emoji="⚡" msg="No skills yet" cta="Start Learning" path="/app/courses" navigate={navigate}/>
              ) : skills.map((s: any) => (
                <div key={s.id} className="d-card p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: s.color + '18' }}>{s.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{s.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: s.color + '18', color: s.color }}>{s.label}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                        initial={{ width: 0 }} animate={{ width: `${s.w}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}/>
                    </div>
                    <p className="text-[10px] mt-1 font-bold" style={{ color: 'var(--text-muted)' }}>{s.prog}% complete</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PROJECTS */}
          {tab === 'projects' && (
            <div className="space-y-2">
              {projects.length === 0 ? (
                <Empty emoji="🛠️" msg="No projects started yet" cta="Go to Projects" path="/app/projects" navigate={navigate}/>
              ) : projects.map(p => (
                <div key={p.id} className="d-card p-4 flex items-center gap-3"
                  style={{ borderColor: p.done ? p.color + '60' : 'var(--border)' }}>
                  <span className="text-3xl flex-shrink-0">{p.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{p.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: p.done ? '#F0FFE5' : p.color + '18', color: p.done ? '#58CC02' : p.color }}>
                        {p.done ? '✓ Done' : 'In Progress'}
                      </span>
                    </div>
                    <p className="text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>{p.desc}</p>
                    <div className="flex gap-1 flex-wrap">
                      {p.tech.map((t: string) => (
                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: p.color + '18', color: p.color }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => navigate('/app/projects')}
                    className="p-2 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: p.done ? '#F0FFE5' : 'var(--surface)' }}>
                    <ExternalLink size={14} style={{ color: p.done ? '#58CC02' : 'var(--text-muted)' }}/>
                  </button>
                </div>
              ))}
              <button onClick={() => navigate('/app/projects')}
                className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-1.5"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
                All Projects <ChevronRight size={14}/>
              </button>
            </div>
          )}

          {/* CERTS */}
          {tab === 'certs' && (
            <div className="space-y-2">
              {certs.length === 0 ? (
                <Empty emoji="📜" msg="Complete courses to earn certs" cta="Browse Courses" path="/app/courses" navigate={navigate}/>
              ) : certs.map(c => (
                <div key={c.id} className="d-card p-4 flex items-center gap-3"
                  style={{ borderColor: c.earned ? c.color + '50' : 'var(--border)' }}>
                  {/* Cert seal */}
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: c.earned ? `linear-gradient(135deg, ${c.color}30, ${c.color}15)` : 'var(--surface)', border: `2px solid ${c.earned ? c.color + '50' : 'var(--border)'}` }}>
                    {c.earned ? c.emoji : '⏳'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{c.title}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Bitzy Academy · {c.earned ? '✅ Earned' : `${c.prog}% complete`}
                    </p>
                    {!c.earned && (
                      <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                        <div className="h-full rounded-full" style={{ width: `${c.prog}%`, backgroundColor: c.color }}/>
                      </div>
                    )}
                  </div>
                  {c.earned && (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FFC80030, #FFC80015)', border: '2px solid #FFC80050' }}>
                      <Trophy size={16} style={{ color: '#FFC800' }}/>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* BADGES */}
          {tab === 'badges' && (
            <div>
              {earnedAchs.length === 0 ? (
                <Empty emoji="🏅" msg="No badges yet" cta="Start Learning" path="/app/courses" navigate={navigate}/>
              ) : (
                <>
                  <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-muted)' }}>
                    {earnedAchs.length} badge{earnedAchs.length !== 1 ? 's' : ''} earned
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {earnedAchs.map((a: any) => (
                      <motion.div key={a.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        className="d-card p-3.5 text-center"
                        style={{ borderColor: a.color + '40', background: `linear-gradient(135deg, ${a.color}10, ${a.color}05)` }}>
                        <div className="text-3xl mb-1.5">{ICON_EMOJI[a.icon] ?? '🏅'}</div>
                        <p className="text-[10px] font-bold leading-tight mb-1" style={{ color: 'var(--text)' }}>{a.title}</p>
                        <div className="flex items-center justify-center gap-0.5 text-[9px] font-bold" style={{ color: a.color }}>
                          <Star size={8}/> +{a.xpReward} XP
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ── Share URL strip ───────────────────────────────────── */}
      <motion.div variants={I} className="mt-5 flex items-center gap-2 p-3 rounded-2xl" style={{ backgroundColor: 'var(--surface)' }}>
        <span className="text-xs truncate flex-1 font-mono" style={{ color: 'var(--text-muted)' }}>{profileUrl}</span>
        <button onClick={copy} className="p-1.5 rounded-lg transition-colors" style={{ backgroundColor: copied ? '#F0FFE5' : 'var(--border)' }}>
          {copied ? <Check size={14} style={{ color: '#58CC02' }}/> : <Copy size={14} style={{ color: 'var(--text-muted)' }}/>}
        </button>
      </motion.div>

    </motion.div>
  );
}

// ── Reusable empty state ──────────────────────────────────────
function Empty({ emoji, msg, cta, path, navigate }: { emoji: string; msg: string; cta: string; path: string; navigate: (p: string) => void }) {
  return (
    <div className="text-center py-12">
      <div className="text-5xl mb-3">{emoji}</div>
      <p className="font-bold text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{msg}</p>
      <button onClick={() => navigate(path)} className="d-btn d-btn-green d-btn-sm">{cta}</button>
    </div>
  );
}