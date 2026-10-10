import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { achievements as achievementsData } from '@/data/achievements';
import {
  awardXP as libAwardXP, awardCoins as libAwardCoins,
  subscribeToProfile, flushOfflineQueue,
} from '@/lib/gamification';
import type { XPPopup } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface CourseProgress {
  course_id: number;
  completed_lessons: string[];
  completed_quizzes: string[];
  overall_progress: number;
}

interface UserAchievement {
  achievement_id: string;
  completed: boolean;
  completed_at: string | null;
  progress: number;
}

interface ChallengeSubmission {
  challenge_id: number;
  status: string;
}

interface GameState {
  courseProgress: CourseProgress[];
  achievements: UserAchievement[];
  submissions: ChallengeSubmission[];
}

interface GameContextType {
  gameState: GameState;
  isLoading: boolean;
  xpPopups: XPPopup[];
  showXPPopup: (amount: number, type: XPPopup['type'], message: string) => void;
  dismissPopup: (id: string) => void;
  addXP: (amount: number, source: string) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  spendEnergy: (amount: number) => Promise<boolean>;
  refillEnergy: () => Promise<boolean>;
  completeLesson: (courseId: number, lessonId: string, totalLessonsInCourse?: number, xpReward?: number, coinReward?: number) => Promise<void>;
  completeQuiz: (courseId: number, quizId: string, score: number, xpReward?: number, coinReward?: number) => Promise<void>;
  completeChallenge: (challengeId: number | string, accepted: boolean, xpReward?: number, coinReward?: number) => Promise<void>;
  hasCompletedLesson: (courseId: number, lessonId: string) => boolean;
  hasCompletedQuiz: (courseId: number, quizId: string) => boolean;
  hasCompletedChallenge: (challengeId: number | string) => boolean;
  getCourseProgress: (courseId: number) => CourseProgress | undefined;
  refreshGameState: () => Promise<void>;
  logActivity: (_type: string, description: string, _xpEarned: number) => Promise<void>;
  checkAchievements: () => Promise<void>;
}

const GameContext = createContext<GameContextType>({
  gameState: { courseProgress: [], achievements: [], submissions: [] },
  isLoading: true,
  xpPopups: [],
  showXPPopup: () => {},
  dismissPopup: () => {},
  addXP: async () => {},
  addCoins: async () => {},
  spendEnergy: async () => false,
  refillEnergy: async () => false,
  completeLesson: async () => {},
  completeQuiz: async () => {},
  completeChallenge: async () => {},
  hasCompletedLesson: () => false,
  hasCompletedQuiz: () => false,
  hasCompletedChallenge: () => false,
  getCourseProgress: () => undefined,
  refreshGameState: async () => {},
  logActivity: async () => {},
  checkAchievements: async () => {},
});

// Helper to get typed table reference
const tbl = (name: string) => supabase.from(name) as any;
export const MAX_ENERGY = 5;

export function GameProvider({ children }: { children: ReactNode }) {
  const { user, refreshProfile } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    courseProgress: [],
    achievements: [],
    submissions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [xpPopups, setXpPopups] = useState<XPPopup[]>([]);

  // Fetch all game state from Supabase
  const fetchGameState = useCallback(async () => {
    if (!user) {
      setGameState({ courseProgress: [], achievements: [], submissions: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [progressRes, achievementsRes, submissionsRes] = await Promise.all([
        tbl('course_progress').select('*').eq('user_id', user.id),
        tbl('user_achievements').select('*').eq('user_id', user.id),
        tbl('challenge_submissions').select('*').eq('user_id', user.id),
      ]);

      setGameState({
        courseProgress: (progressRes.data || []).map((p: any) => ({
          course_id: p.course_id,
          completed_lessons: p.completed_lessons || [],
          completed_quizzes: p.completed_quizzes || [],
          overall_progress: p.overall_progress || 0,
        })),
        achievements: (achievementsRes.data || []).map((a: any) => ({
          achievement_id: a.achievement_id,
          completed: a.completed,
          completed_at: a.completed_at,
          progress: a.progress || 0,
        })),
        submissions: (submissionsRes.data || []).map((s: any) => ({
          challenge_id: s.challenge_id,
          status: s.status,
        })),
      });
    } catch (e) {
      console.error('Error fetching game state:', e);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGameState();
  }, [fetchGameState]);

  // Realtime sync (Feature 11): any profile change — from this tab, another
  // tab, or another device — pushes straight to the UI with no refresh.
  // Also flush anything saved locally while offline (Feature 12) as soon as
  // we have a user, so a reconnect never loses XP/progress.
  useEffect(() => {
    if (!user) return;
    flushOfflineQueue();
    const unsubscribe = subscribeToProfile(user.id, () => { refreshProfile(); });
    return unsubscribe;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Keep the Profile's course, badge, and challenge summaries current across tabs/devices.
  // Supabase Realtime provides immediate updates; visible-tab polling is the fallback
  // when a deployment has not enabled database changes for one of these tables.
  useEffect(() => {
    if (!user?.id) return;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => { void fetchGameState(); }, 250);
    };
    const channel = supabase.channel(`profile-game-state:${user.id}`);
    for (const table of ['course_progress', 'user_achievements', 'challenge_submissions']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` }, refresh);
    }
    channel.subscribe();
    return () => { if (debounce) clearTimeout(debounce); void supabase.removeChannel(channel); };
  }, [user?.id, fetchGameState]);

  const showXPPopup = (amount: number, type: XPPopup['type'], message: string) => {
    const popup: XPPopup = {
      id: Date.now().toString() + Math.random(),
      amount,
      type,
      message,
    };
    setXpPopups((prev) => [...prev, popup]);
    setTimeout(() => {
      setXpPopups((prev) => prev.filter((p) => p.id !== popup.id));
    }, 4000);
  };

  const dismissPopup = (id: string) => {
    setXpPopups((prev) => prev.filter((p) => p.id !== id));
  };

  // Read current profile value from DB to avoid stale closure issues
  const getProfileData = async (): Promise<{ xp: number; coins: number; energy: number; level: number } | null> => {
    if (!user) return null;
    try {
      const { data } = await tbl('profiles').select('xp,coins,energy,level').eq('user_id', user.id).single();
      return data as any;
    } catch {
      return null;
    }
  };

  // Safe DB update that always works
  const safeUpdateProfile = async (updates: Record<string, any>) => {
    if (!user) return false;
    try {
      const { error } = await tbl('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
      if (error) {
        console.error('Profile update error:', error);
        return false;
      }
      await refreshProfile();
      return true;
    } catch (e) {
      console.error('Profile update exception:', e);
      return false;
    }
  };

  // Delegates to src/lib/gamification.ts — the ONE place XP/coins are ever
  // written (also handles leaderboard sync + offline queueing there), then
  // refreshes the local profile so the UI reflects it immediately.
  const addXP = async (amount: number, source: string) => {
    if (!user) return;
    const result = await libAwardXP(user.id, amount, source);
    if (!result) console.warn('[addXP] failed or queued offline');
    await refreshProfile();
  };

  const addCoins = async (amount: number) => {
    if (!user) return;
    const result = await libAwardCoins(user.id, amount);
    if (result === null) console.warn('[addCoins] failed or queued offline');
    await refreshProfile();
  };

  // Never blocks the user — energy is cosmetic/pacing only.
  // Always returns true so lesson/quiz/challenge completion can never be stuck.
  const spendEnergy = async (amount: number): Promise<boolean> => {
    if (!user) return true;
    try {
      const current = await getProfileData();
      if (!current) return true;

      let energy = current.energy ?? MAX_ENERGY;
      if (energy < amount) energy = MAX_ENERGY; // auto-refill to default max
      const newEnergy = Math.max(0, energy - amount);
      await safeUpdateProfile({ energy: newEnergy });
    } catch (e) {
      console.error('spendEnergy error (non-blocking):', e);
    }
    return true;
  };

  // Watch a rewarded ad -> refill hearts (energy) to max.
  const refillEnergy = async (): Promise<boolean> => {
    if (!user) return true;
    try {
      await safeUpdateProfile({ energy: MAX_ENERGY });
    } catch (e) {
      console.error('refillEnergy error (non-blocking):', e);
    }
    return true;
  };

  // Keyword matchers for course-completion badges — match against the course's
  // real title/slug from the DB rather than assuming fixed numeric course_ids.
  // \b word-boundary regexes so 'c' doesn't match inside 'c++' and 'java'
  // doesn't match inside 'javascript'.
  const COURSE_BADGE_MATCHERS: Record<string, { include: RegExp[]; exclude?: RegExp[] }> = {
    'html-rookie': { include: [/\bhtml\b/i] },
    'css-artist': { include: [/\bcss\b/i] },
    'js-ninja': { include: [/\bjavascript\b/i, /\bjs\b/i] },
    'react-champion': { include: [/\breact\b/i] },
    'python-wizard': { include: [/\bpython\b/i] },
    'computer-fundamentals-badge': { include: [/computer\s*fundamentals?/i, /programming\s*fundamentals?/i, /\bcs\s*fundamentals?\b/i] },
    'c-programmer': { include: [/\bc\b/i, /\bc\s*programming\b/i], exclude: [/c\+\+/i, /\bcpp\b/i, /c#/i, /c-sharp/i] },
    'cpp-master': { include: [/c\+\+/i, /\bcpp\b/i] },
    'java-developer': { include: [/\bjava\b/i], exclude: [/javascript/i] },
  };

  const checkAchievements = async () => {
    if (!user) return;
    try {
      const { data: profileData } = await tbl('profiles').select('xp,level,current_streak,coins').eq('user_id', user.id).single();
      const { data: progressData } = await tbl('course_progress').select('*').eq('user_id', user.id);
      const { data: submissionsData } = await tbl('challenge_submissions').select('*').eq('user_id', user.id);
      const { data: existingAchs } = await tbl('user_achievements').select('*').eq('user_id', user.id);
      const { data: coursesData } = await tbl('courses').select('id,slug,title');
      const { data: gameProgressData } = await tbl('game_progress').select('game_name,times_played').eq('user_id', user.id);

      const totalLessons = (progressData || []).reduce((sum: number, p: any) => sum + (p.completed_lessons?.length || 0), 0);
      const totalQuizzes = (progressData || []).reduce((sum: number, p: any) => sum + (p.completed_quizzes?.length || 0), 0);
      const totalChallenges = (submissionsData || []).filter((s: any) => s.status === 'accepted').length;
      const streak = (profileData as any)?.current_streak || 0;
      const coins = (profileData as any)?.coins || 0;

      const courseInfoById = new Map<number, string>(
        (coursesData || []).map((c: any) => [c.id, `${c.title ?? ''} ${c.slug ?? ''}`.toLowerCase()])
      );
      const completedCourseTexts = (progressData || [])
        .filter((p: any) => (p.overall_progress || 0) >= 100)
        .map((p: any) => courseInfoById.get(p.course_id))
        .filter(Boolean) as string[];

      const matchesBadge = (matcher: { include: RegExp[]; exclude?: RegExp[] }) =>
        completedCourseTexts.some(text =>
          matcher.include.some(re => re.test(text)) && !(matcher.exclude || []).some(re => re.test(text))
        );

      const totalGamesPlayed = (gameProgressData || []).reduce((sum: number, g: any) => sum + (g.times_played || 0), 0);
      const distinctGamesPlayed = new Set((gameProgressData || []).map((g: any) => g.game_name)).size;

      // IDs must match src/data/achievements.ts exactly (DB FK enforces this)
      const achChecks = [
        { id: 'first-steps', condition: totalLessons >= 1 },
        { id: 'getting-warm', condition: totalLessons >= 5 },
        { id: 'lesson-learner', condition: totalLessons >= 25 },
        { id: 'quiz-whiz', condition: totalQuizzes >= 1 },
        { id: 'course-starter', condition: (progressData || []).length >= 1 },
        { id: 'course-finisher', condition: completedCourseTexts.length >= 1 },
        { id: 'hello-world', condition: totalChallenges >= 1 },
        { id: 'bug-hunter', condition: totalChallenges >= 5 },
        { id: 'code-newbie', condition: totalChallenges >= 10 },
        { id: 'first-day', condition: streak >= 1 },
        { id: 'three-day-streak', condition: streak >= 3 },
        { id: 'week-warrior', condition: streak >= 7 },
        { id: 'monthly-master', condition: streak >= 30 },
        { id: 'unstoppable', condition: streak >= 100 },
        { id: 'rich', condition: coins >= 1000 },
        { id: 'html-rookie', condition: matchesBadge(COURSE_BADGE_MATCHERS['html-rookie']) },
        { id: 'css-artist', condition: matchesBadge(COURSE_BADGE_MATCHERS['css-artist']) },
        { id: 'js-ninja', condition: matchesBadge(COURSE_BADGE_MATCHERS['js-ninja']) },
        { id: 'react-champion', condition: matchesBadge(COURSE_BADGE_MATCHERS['react-champion']) },
        { id: 'python-wizard', condition: matchesBadge(COURSE_BADGE_MATCHERS['python-wizard']) },
        { id: 'computer-fundamentals-badge', condition: matchesBadge(COURSE_BADGE_MATCHERS['computer-fundamentals-badge']) },
        { id: 'c-programmer', condition: matchesBadge(COURSE_BADGE_MATCHERS['c-programmer']) },
        { id: 'cpp-master', condition: matchesBadge(COURSE_BADGE_MATCHERS['cpp-master']) },
        { id: 'java-developer', condition: matchesBadge(COURSE_BADGE_MATCHERS['java-developer']) },
        { id: 'first-game', condition: totalGamesPlayed >= 1 },
        { id: 'game-explorer', condition: distinctGamesPlayed >= 3 },
      ];

      const existingMap = new Map((existingAchs || []).map((a: any) => [a.achievement_id, a]));
      const newlyUnlocked: string[] = [];

      for (const ach of achChecks) {
        const existing = existingMap.get(ach.id) as any;
        if (existing?.completed) continue; // already unlocked

        if (ach.condition) {
          const { error } = await tbl('user_achievements').upsert({
            user_id: user.id, achievement_id: ach.id, completed: true,
            completed_at: new Date().toISOString(), progress: 100,
          }, { onConflict: 'user_id,achievement_id' });
          if (!error) newlyUnlocked.push(ach.id);
          else console.error(`Achievement upsert failed for ${ach.id}:`, error.message);
        } else if (!existing) {
          // Track progress for not-yet-unlocked achievements (optional, ignore errors)
          await tbl('user_achievements').upsert({
            user_id: user.id, achievement_id: ach.id, completed: false, progress: 0,
          }, { onConflict: 'user_id,achievement_id' }).then(() => {}, () => {});
        }
      }

      // Show popup for newly unlocked badges
      for (const id of newlyUnlocked) {
        const meta = achievementsData.find(a => a.id === id);
        if (meta) {
          showXPPopup(meta.xpReward, 'xp', `🏆 Badge unlocked: ${meta.title}!`);
        }
      }
    } catch (e) {
      console.error('checkAchievements error:', e);
    }
  };

  const completeLesson = async (
    courseId: number, lessonId: string, totalLessonsInCourse?: number,
    xpReward = 25, coinReward = 10,
  ) => {
    if (!user) { console.warn('[completeLesson] No user — aborting'); return; }
    try {
      const total = totalLessonsInCourse || 20;
      console.log('[completeLesson] user=', user.id, 'courseId=', courseId, 'lessonId=', lessonId, 'total=', total);

      const { data: existingRow, error: fetchErr } = await tbl('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (fetchErr) console.error('[completeLesson] fetch existing error:', fetchErr.message);
      console.log('[completeLesson] existingRow=', existingRow);

      // Normalize all IDs to strings to avoid '12' vs 12 mismatch
      let lessons: string[] = (existingRow?.completed_lessons || []).map(String);
      const lessonIdStr = String(lessonId);
      // Feature 5 — duplicate-XP prevention: if this lesson was already
      // marked complete, only update bookkeeping and skip re-awarding
      // XP/coins entirely (previously this ran unconditionally every call).
      const alreadyCompleted = lessons.includes(lessonIdStr);
      if (!alreadyCompleted) lessons = [...lessons, lessonIdStr];
      const progress = Math.min(100, Math.round((lessons.length / total) * 100));
      console.log('[completeLesson] new lessons=', lessons, 'progress=', progress);

      const { data: upsertData, error: upsertErr } = await tbl('course_progress').upsert({
        user_id: user.id,
        course_id: courseId,
        completed_lessons: lessons,
        completed_quizzes: existingRow?.completed_quizzes || [],
        overall_progress: progress,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,course_id' }).select();

      if (upsertErr) {
        console.error('[completeLesson] UPSERT FAILED:', upsertErr.message, upsertErr.code, upsertErr.details);
        return;
      }
      console.log('[completeLesson] upsert success:', upsertData);

      // ── Auto-award certificate the moment a course hits 100% (first time only) ──
      const wasAlready100 = (existingRow?.overall_progress || 0) >= 100;
      if (progress >= 100 && !wasAlready100) {
        try {
          const { data: courseRow, error: courseErr } = await tbl('courses').select('slug,title').eq('id', courseId).maybeSingle();
          if (courseErr) console.error('[completeLesson] course lookup for cert failed:', courseErr.message);
          if (courseRow) {
            const { error: certErr } = await tbl('user_certificates').upsert({
              user_id: user.id,
              certificate_id: courseRow.slug,
              title: courseRow.title,
              issuer: 'Bitzy Academy',
            }, { onConflict: 'user_id,certificate_id', ignoreDuplicates: true });
            if (certErr) console.error('[completeLesson] certificate award error:', certErr.message);
            else showXPPopup(0, 'xp', `🎓 Certificate earned for "${courseRow.title}"!`);
          }
        } catch (certE) {
          console.error('[completeLesson] certificate award exception:', certE);
        }
      }

      if (!alreadyCompleted) {
        // Dynamic XP (Feature 3): read the reward straight from the lesson
        // record instead of a hardcoded number.
        await addXP(xpReward, 'lesson');
        await addCoins(coinReward);
        showXPPopup(xpReward, 'xp', `+${xpReward} XP! Lesson complete! 🎉`);
        showXPPopup(coinReward, 'coin', `+${coinReward} gems! 💎`);
      } else {
        console.log('[completeLesson] already completed — skipping XP re-award');
      }
      await checkAchievements();
      await fetchGameState();
      console.log('[completeLesson] DONE — gameState refreshed');
    } catch (e) {
      console.error('[completeLesson] EXCEPTION:', e);
    }
  };

  const completeQuiz = async (
    courseId: number, quizId: string, score: number,
    xpReward?: number, coinReward?: number,
  ) => {
    if (!user) return;
    try {
      const { data: existingRow } = await tbl('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      let quizzes: string[] = existingRow?.completed_quizzes || [];
      // Feature 5 — duplicate-XP prevention: retaking an already-passed quiz
      // updates the score bookkeeping but never re-awards XP/coins.
      const alreadyCompleted = quizzes.includes(quizId);
      if (!alreadyCompleted) quizzes = [...quizzes, quizId];

      const { error: upsertErr } = await tbl('course_progress').upsert({
        user_id: user.id,
        course_id: courseId,
        completed_lessons: existingRow?.completed_lessons || [],
        completed_quizzes: quizzes,
        overall_progress: existingRow?.overall_progress || 5,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,course_id' });

      if (upsertErr) {
        console.error('completeQuiz upsert error:', upsertErr.message);
        return;
      }

      if (!alreadyCompleted) {
        // Dynamic XP (Feature 3): scale the quiz's real xp_reward/coin_reward
        // by score. Falls back to the old flat formula only if no reward was
        // passed in (keeps any other caller working unchanged).
        const xpGain = xpReward != null
          ? Math.max(1, Math.round((score / 100) * xpReward))
          : (score >= 100 ? 50 : Math.round(score / 2));
        const coinGain = coinReward != null
          ? Math.max(0, Math.round((score / 100) * coinReward))
          : 15;
        await addXP(xpGain, 'quiz');
        await addCoins(coinGain);
        showXPPopup(xpGain, 'xp', `+${xpGain} XP! Quiz done! 🎯`);
        showXPPopup(coinGain, 'coin', `+${coinGain} gems! 💎`);
      }
      await checkAchievements();
      await fetchGameState();
    } catch (e) {
      console.error('completeQuiz error:', e);
    }
  };

  const completeChallenge = async (challengeId: number | string, accepted: boolean, xpReward = 75, coinReward = 30) => {
    if (!user) return;
    try {
      await tbl('challenge_submissions').upsert({
        user_id: user.id, challenge_id: challengeId,
        status: accepted ? 'accepted' : 'attempted',
      }, { onConflict: 'user_id,challenge_id' });

      if (accepted && !hasCompletedChallenge(challengeId)) {
        await addXP(xpReward, 'challenge');
        await addCoins(coinReward);
      }

      await checkAchievements();
      await fetchGameState();
    } catch (e) {
      console.error('completeChallenge error:', e);
    }
  };

  const hasCompletedLesson = (courseId: number | string, lessonId: string): boolean => {
    const progress = gameState.courseProgress.find((p) => String(p.course_id) === String(courseId));
    return progress?.completed_lessons?.map(String).includes(String(lessonId)) ?? false;
  };

  const hasCompletedQuiz = (courseId: number | string, quizId: string): boolean => {
    const progress = gameState.courseProgress.find((p) => String(p.course_id) === String(courseId));
    return progress?.completed_quizzes?.includes(quizId) ?? false;
  };

  const hasCompletedChallenge = (challengeId: number | string): boolean => {
    const sub = gameState.submissions.find((s) => String(s.challenge_id) === String(challengeId));
    return sub?.status === 'accepted';
  };

  const getCourseProgress = (courseId: number | string): CourseProgress | undefined => {
    return gameState.courseProgress.find((p) => String(p.course_id) === String(courseId));
  };

  const refreshGameState = async () => {
    await fetchGameState();
  };

  const logActivity = async (_type: string, description: string, _xpEarned: number) => {
    if (!user) return;
    try {
      await tbl('activity_logs').insert({
        user_id: user.id, activity_type: _type, description, xp_earned: _xpEarned,
      });
    } catch {
      // Silently fail - activity logs are not critical
    }
  };

  return (
    <GameContext.Provider value={{
      gameState, isLoading, xpPopups, showXPPopup, dismissPopup,
      addXP, addCoins, spendEnergy, refillEnergy, completeLesson, completeQuiz, completeChallenge,
      hasCompletedLesson, hasCompletedQuiz, hasCompletedChallenge, getCourseProgress,
      refreshGameState, logActivity, checkAchievements,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}