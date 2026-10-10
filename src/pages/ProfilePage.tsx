import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Swords, Settings, Target, TrendingUp, ChevronRight, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useCourses } from '@/hooks/useDB';
import { achievements } from '@/data/achievements';
import { getLevelFromXP } from '@/context/xpUtils';
import { supabase } from '@/lib/supabase';
import PlayerTagBadge from '@/components/PlayerTagBadge';
import BadgeShowcase from '@/components/BadgeShowcase';
import LearningAnalytics from '@/pages/Dashboard';

const C = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoading, user } = useAuth();
  const { gameState, refreshGameState } = useGame();
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0);
  const { data: allCourses } = useCourses();
  // Whether I'm currently #1 on the global XP leaderboard — drives the
  // automatic "#1" tag next to my own name too.
  const [isTopXP, setIsTopXP] = useState(false);

  // Refresh this page's summary and analytics together. Realtime provides immediate
  // updates; focus and visible-tab polling cover sessions where replication is disabled.
  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        void refreshGameState();
        setAnalyticsRefresh(value => value + 1);
      }
    };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [user?.id, refreshGameState]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .gt('xp', profile.xp ?? 0)
      .then(({ count }) => { if (!cancelled) setIsTopXP((count ?? 0) === 0); });
    return () => { cancelled = true; };
  }, [profile?.user_id, profile?.xp]);

  if (isLoading || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayName      = profile.display_name ?? 'Learner';
  const avatar            = profile.avatar;
  const courseProgress   = gameState.courseProgress ?? [];
  const userAchs          = gameState.achievements ?? [];
  const submissions       = gameState.submissions ?? [];

  const solvedChallenges   = submissions.filter(s => s.status === 'accepted').length;
  const totalLessons       = courseProgress.reduce((s, c) => s + (c.completed_lessons?.length ?? 0), 0);
  const totalQuizzes       = courseProgress.reduce((s, c) => s + (c.completed_quizzes?.length ?? 0), 0);
  const completedCourses   = courseProgress.filter(c => c.overall_progress >= 100).length;

  // XP to next level — uses the same shared formula as everywhere else in
  // the app (Dashboard, GameContext), instead of an ad-hoc local formula
  // that gave a different number here than everywhere else.
  const levelInfo   = getLevelFromXP(profile.xp ?? 0);
  const xpForNext   = levelInfo.currentLevelXP + levelInfo.xpToNext;
  const xpProgress  = xpForNext > 0 ? Math.min((levelInfo.currentLevelXP / xpForNext) * 100, 100) : 100;

  // Active courses (started but not done)
  const activeCourses = courseProgress
    .filter(c => c.overall_progress > 0 && c.overall_progress < 100)
    .sort((a, b) => b.overall_progress - a.overall_progress)
    .slice(0, 3);

  // Recent achievements
  // Slice a generous amount (not just 5) so the "+N more" tile in
  // BadgeShowcase reflects real overflow beyond what's shown.
  const recentAchs = userAchs
    .filter(a => a.completed)
    .slice(-16)
    .reverse()
    .map(ua => achievements.find(a => a.id === ua.achievement_id))
    .filter(Boolean) as typeof achievements;

  return (
    <motion.div variants={C} initial="hidden" animate="show" className="space-y-5">

      {/* Profile hero */}
      <motion.div variants={I} className="d-card overflow-hidden !p-0">
        <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #58CC02 0%, #1CB0F6 60%, #CE82FF 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        </div>

        <div className="px-5 pb-4 relative">
          {/* Settings button floats just below the banner, independent of avatar/name layout */}
          <button onClick={() => navigate('/app/settings')}
            className="absolute top-3 right-5 w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            style={{ backgroundColor: 'var(--white)' }}>
            <Settings className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Avatar overlaps the banner on its own; name block gets a fixed pt so it
              never collides with the banner regardless of avatar size or font height */}
          <div className="flex items-start gap-4 mb-3">
            <motion.div whileHover={{ scale: 1.05 }}
              className="w-24 h-24 -mt-12 rounded-3xl border-4 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #58CC02, #89E219)', borderColor: 'var(--white)' }}>
              {avatar ? <img src={avatar} alt="" className="w-full h-full rounded-3xl object-cover" /> : displayName[0]?.toUpperCase()}
            </motion.div>
            <div className="pt-14 flex-1 min-w-0">
              <h1 className="font-display text-lg font-bold leading-tight truncate">{displayName}</h1>
              <div className="mt-1"><PlayerTagBadge role={profile.role} rank={isTopXP ? 1 : null} tag={profile.custom_tag} tagColor={profile.custom_tag_color} /></div>
              <p className="text-xs truncate mt-1" style={{ color: 'var(--text-muted)' }}>{profile.bio ?? 'Learning to code! 🚀'}</p>
            </div>
          </div>

          {/* Level + XP bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span style={{ color: '#FFC800' }}>⭐ Level {profile.level}</span>
              <span style={{ color: 'var(--text-muted)' }}>{profile.xp % xpForNext} / {xpForNext} XP</span>
            </div>
            <div className="d-progress h-3 rounded-full overflow-hidden">
              <motion.div
                className="d-progress-fill h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #58CC02, #FFC800)' }}
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--text-muted)' }}>
              {xpForNext - (profile.xp % xpForNext)} XP to Level {profile.level + 1}
            </p>
          </div>

          {/* 4 stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'XP',      value: profile.xp.toLocaleString(), color: '#58CC02', bg: 'rgba(88,204,2,0.12)' },
              { label: 'Coins',   value: profile.coins,               color: '#1CB0F6', bg: 'rgba(28,176,246,0.12)' },
              { label: 'Streak',  value: `${profile.current_streak}🔥`, color: '#FF9600', bg: 'rgba(255,150,0,0.12)' },
              { label: 'Longest', value: `${profile.longest_streak}🔥`, color: '#FF4B4B', bg: 'rgba(255,75,75,0.12)' },
            ].map(s => (
              <div key={s.label} className="p-2 rounded-2xl" style={{ backgroundColor: s.bg }}>
                <div className="font-display font-bold text-xs leading-tight" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Activity stats */}
      <motion.div variants={I} className="d-card !p-4">
        <h2 className="font-display font-bold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: '#2B7FFF' }} /> Activity
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Lessons Done',   value: totalLessons,      icon: BookOpen, color: '#58CC02' },
            { label: 'Challenges',     value: solvedChallenges,  icon: Swords,   color: '#FF4B4B' },
            { label: 'Quizzes',        value: totalQuizzes,      icon: Target,   color: '#CE82FF' },
            { label: 'Courses Done',   value: completedCourses,  icon: Trophy,   color: '#FFC800' },
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2.5 p-3 rounded-2xl"
              style={{ backgroundColor: stat.color + '10' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: stat.color + '20' }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="font-display font-black text-base leading-none" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active courses */}
      {activeCourses.length > 0 && (
        <motion.div variants={I} className="d-card !p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold">📚 In Progress</h2>
            <button onClick={() => navigate('/app/courses')} className="text-xs font-bold" style={{ color: '#2B7FFF' }}>
              All courses →
            </button>
          </div>
          <div className="space-y-2.5">
            {activeCourses.map(cp => {
              const course = (allCourses ?? []).find((c: any) => c.id === cp.course_id);
              if (!course) return null;
              return (
                <button key={cp.course_id} onClick={() => navigate(`/app/courses`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-colors"
                  style={{ backgroundColor: 'var(--surface)' }}>
                  <span className="text-xl">{course.icon || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 d-progress h-1.5 rounded-full overflow-hidden">
                        <div className="d-progress-fill h-full rounded-full" style={{ width: `${cp.overall_progress}%`, backgroundColor: course.color || '#58CC02' }} />
                      </div>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: course.color || '#58CC02' }}>{cp.overall_progress}%</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Saved learning analytics, embedded without replacing existing profile sections */}
      <motion.section variants={I} aria-labelledby="profile-learning-analytics-title">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 id="profile-learning-analytics-title" className="font-display font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: '#2B7FFF' }} /> Learning Analytics
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }} aria-label="Analytics refresh automatically">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#58CC02' }} /> Auto-updating
          </span>
        </div>
        <LearningAnalytics embedded refreshToken={analyticsRefresh || undefined} />
      </motion.section>

      {/* Recent badges */}
      <motion.div variants={I}>
        <BadgeShowcase
          earnedAchievements={recentAchs}
          totalCount={achievements.length}
          onViewAll={() => navigate('/app/achievements')}
          onBadgeClick={() => navigate('/app/achievements')}
        />
      </motion.div>



      {/* Settings */}
      <motion.button variants={I} whileTap={{ scale: 0.98 }} onClick={() => navigate('/app/settings')}
        className="w-full d-card !p-4 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
          <Settings className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="flex-1">
          <p className="font-bold">Settings</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage your account & preferences</p>
        </div>
        <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
      </motion.button>

      <div className="h-4" />
    </motion.div>
  );
}
