/**
 * src/pages/PublicProfilePage.tsx
 *
 * Read-only view of ANY player's profile by user id — no edit controls,
 * no settings link, just their stats/badges/progress. Reached via
 * /app/profile/u/:userId (leaderboard rows, league members, etc. link
 * here). If :userId is the signed-in user, we bounce to the normal
 * editable /app/profile instead.
 *
 * Data comes straight from Supabase, scoped to the target user_id —
 * mirrors the fetch pattern already used in GameContext for "my own"
 * data, just parameterized. NOTE: this requires the `profiles`,
 * `user_achievements`, `challenge_submissions`, and `course_progress`
 * tables to allow public SELECT (or at least SELECT by any
 * authenticated user) in Supabase RLS — the same requirement the
 * leaderboard already has for `profiles`. If those tables are currently
 * locked to `auth.uid() = user_id` only, add a policy such as:
 *
 *   create policy "Public read" on public.profiles
 *     for select using (true);
 *   create policy "Public read" on public.user_achievements
 *     for select using (true);
 *   create policy "Public read" on public.challenge_submissions
 *     for select using (true);
 *   create policy "Public read" on public.course_progress
 *     for select using (true);
 *
 * (Run once per table in the Supabase SQL editor.)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Swords, Target, TrendingUp, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { achievements } from '@/data/achievements';
import { getLevelFromXP } from '@/context/xpUtils';
import PlayerTagBadge from '@/components/PlayerTagBadge';
import BadgeShowcase from '@/components/BadgeShowcase';

const C = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const ICON_EMOJI: Record<string, string> = {
  Footprints: '👣', Flame: '🔥', BookOpen: '📖', HelpCircle: '❓', Target: '🎯',
  Moon: '🌙', Rocket: '🚀', Trophy: '🏆', Terminal: '💻', Bug: '🐛',
  Code: '💡', Zap: '⚡', Timer: '⏱️', Languages: '🌐', Sun: '☀️',
  Star: '⭐', Award: '🏅', Shield: '🛡️', Heart: '❤️', Crown: '👑',
};

interface PublicProfile {
  user_id: string;
  display_name: string | null;
  avatar: string | null;
  bio: string | null;
  xp: number;
  level: number;
  coins: number;
  current_streak: number;
  longest_streak: number;
  role: string;
  custom_tag: string | null;
  custom_tag_color: string | null;
}

export default function PublicProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [achCount, setAchCount] = useState(0);
  const [recentAchIds, setRecentAchIds] = useState<string[]>([]);
  const [solvedChallenges, setSolvedChallenges] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  // Whether this player currently sits at #1 on the global XP leaderboard
  // — drives the automatic "#1" tag (separate from any admin-assigned tag).
  const [isTopXP, setIsTopXP] = useState(false);

  // Viewing your own id here just sends you to the editable profile.
  useEffect(() => {
    if (userId && user && userId === user.id) {
      navigate('/app/profile', { replace: true });
    }
  }, [userId, user, navigate]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('user_id,display_name,avatar,bio,xp,level,coins,current_streak,longest_streak,role,custom_tag,custom_tag_color')
        .eq('user_id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (profileErr || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(profileData as PublicProfile);

      // Is this player #1 on the global leaderboard? Count anyone with
      // strictly more XP — zero such players means they're on top.
      supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true })
        .gt('xp', (profileData as PublicProfile).xp ?? 0)
        .then(({ count }) => { if (!cancelled) setIsTopXP((count ?? 0) === 0); });

      const [{ data: achData }, { data: subData }, { data: progressData }] = await Promise.all([
        supabase.from('user_achievements').select('achievement_id,completed').eq('user_id', userId),
        supabase.from('challenge_submissions').select('status').eq('user_id', userId),
        supabase.from('course_progress').select('overall_progress,completed_lessons,completed_quizzes').eq('user_id', userId),
      ]);

      if (cancelled) return;

      const completedAchs = (achData ?? []).filter((a: any) => a.completed);
      setAchCount(completedAchs.length);
      // Fetch a generous slice (not just 5) so the "+N more" tile in
      // BadgeShowcase reflects real overflow beyond what's shown.
      setRecentAchIds(completedAchs.slice(-16).reverse().map((a: any) => a.achievement_id));

      setSolvedChallenges((subData ?? []).filter((s: any) => s.status === 'accepted').length);

      const progress = progressData ?? [];
      setTotalLessons(progress.reduce((s: number, c: any) => s + (c.completed_lessons?.length ?? 0), 0));
      setTotalQuizzes(progress.reduce((s: number, c: any) => s + (c.completed_quizzes?.length ?? 0), 0));
      setCompletedCourses(progress.filter((c: any) => c.overall_progress >= 100).length);

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-4xl">🕵️</p>
        <p className="font-bold">Couldn't find that player</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Their profile may be private, or the link is out of date.
        </p>
        <button onClick={() => navigate(-1)} className="btn-3d btn-3d-blue px-5 py-2 text-sm mt-2">Go back</button>
      </div>
    );
  }

  const displayName = profile.display_name ?? 'Learner';
  const levelInfo = getLevelFromXP(profile.xp ?? 0);
  const xpForNext = levelInfo.currentLevelXP + levelInfo.xpToNext;
  const xpProgress = xpForNext > 0 ? Math.min((levelInfo.currentLevelXP / xpForNext) * 100, 100) : 100;
  const recentAchs = recentAchIds
    .map(id => achievements.find(a => a.id === id))
    .filter(Boolean) as typeof achievements;

  return (
    <motion.div variants={C} initial="hidden" animate="show" className="space-y-5">

      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Profile hero — same layout as the editable profile, no settings gear */}
      <motion.div variants={I} className="d-card overflow-hidden !p-0">
        <div className="h-24 relative" style={{ background: 'linear-gradient(135deg, #58CC02 0%, #1CB0F6 60%, #CE82FF 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        </div>

        <div className="px-5 pb-4 relative">
          <div className="flex items-start gap-4 mb-3">
            <div className="w-24 h-24 -mt-12 rounded-3xl border-4 flex items-center justify-center text-2xl font-black text-white flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #58CC02, #89E219)', borderColor: 'var(--white)' }}>
              {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full rounded-3xl object-cover" /> : displayName[0]?.toUpperCase()}
            </div>
            <div className="pt-14 flex-1 min-w-0">
              <h1 className="font-display text-lg font-bold leading-tight truncate">{displayName}</h1>
              <div className="mt-1"><PlayerTagBadge role={profile.role} rank={isTopXP ? 1 : null} tag={profile.custom_tag} tagColor={profile.custom_tag_color} /></div>
              <p className="text-xs truncate mt-1" style={{ color: 'var(--text-muted)' }}>{profile.bio ?? 'Learning to code! 🚀'}</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span style={{ color: '#FFC800' }}>⭐ Level {profile.level}</span>
              <span style={{ color: 'var(--text-muted)' }}>{levelInfo.currentLevelXP} / {xpForNext} XP</span>
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
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'XP', value: profile.xp.toLocaleString(), color: '#58CC02', bg: 'rgba(88,204,2,0.12)' },
              { label: 'Coins', value: profile.coins, color: '#1CB0F6', bg: 'rgba(28,176,246,0.12)' },
              { label: 'Streak', value: `${profile.current_streak}🔥`, color: '#FF9600', bg: 'rgba(255,150,0,0.12)' },
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
            { label: 'Lessons Done', value: totalLessons, icon: BookOpen, color: '#58CC02' },
            { label: 'Challenges', value: solvedChallenges, icon: Swords, color: '#FF4B4B' },
            { label: 'Quizzes', value: totalQuizzes, icon: Target, color: '#CE82FF' },
            { label: 'Courses Done', value: completedCourses, icon: Trophy, color: '#FFC800' },
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

      {/* Badges */}
      <motion.div variants={I}>
        <BadgeShowcase
          earnedAchievements={recentAchs}
          totalCount={achievements.length}
          title={`🏅 ${displayName}'s Badges`}
        />
      </motion.div>

      <div className="h-4" />
    </motion.div>
  );
}
