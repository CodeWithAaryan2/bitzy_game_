/**
 * src/lib/gamification.ts
 *
 * Single source of truth for all persistent progress: XP, coins, level,
 * per-game resume, per-question dedupe, streaks, leaderboard sync,
 * offline queueing and realtime profile sync.
 *
 * Every game/course/quiz component should go through these functions
 * instead of touching Supabase directly, so there is exactly one place
 * that knows how XP is awarded and progress is saved.
 *
 * Works for ANY game_name / question_id — nothing here is hardcoded to a
 * specific game or course, so new games/courses need zero changes here.
 */
import { supabase } from '@/lib/supabase';
import { getLevelFromXP } from '@/context/xpUtils';
import type { Database } from '@/types/database';

/* eslint-disable @typescript-eslint/no-explicit-any */
const tbl = (name: string) => supabase.from(name) as any;

type Profile = Database['public']['Tables']['profiles']['Row'];
type GameProgressRow = Database['public']['Tables']['game_progress']['Row'];

// ============================================================
// LEVEL CALCULATION
// ============================================================
export interface LevelInfo {
  level: number;
  xpInCurrentLevel: number;
  xpNeededForNextLevel: number;
}

/** Reusable helper — wraps the app's real XP curve (xpUtils.getLevelFromXP)
 *  under the name requested for the gamification system. Never duplicate
 *  the curve itself; this just re-shapes its return value. */
export function calculateLevel(totalXP: number): LevelInfo {
  const { level, currentLevelXP, xpToNext } = getLevelFromXP(Math.max(0, totalXP));
  return { level, xpInCurrentLevel: currentLevelXP, xpNeededForNextLevel: xpToNext };
}

// ============================================================
// OFFLINE QUEUE — if a Supabase write fails (no network), stash it and
// retry automatically when the browser comes back online. Prevents lost
// XP/progress on flaky connections without ever double-awarding, because
// every queued action re-runs through the same dedupe-safe functions.
// ============================================================
const OFFLINE_QUEUE_KEY = 'bitzy_offline_queue';

type OfflineAction =
  | { type: 'awardXP'; userId: string; amount: number; source: string; queuedAt: number }
  | { type: 'awardCoins'; userId: string; amount: number; queuedAt: number }
  | { type: 'saveGameProgress'; userId: string; gameName: string; payload: SaveGameProgressInput; queuedAt: number };

function readQueue(): OfflineAction[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineAction[]) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* localStorage unavailable — nothing we can do, degrade silently */
  }
}

function queueOfflineAction(action: OfflineAction) {
  const queue = readQueue();
  queue.push(action);
  writeQueue(queue);
}

/** Replays anything saved while offline. Safe to call repeatedly — each
 *  queued action goes back through the normal (dedupe-safe) functions. */
export async function flushOfflineQueue(): Promise<void> {
  const queue = readQueue();
  if (!queue.length) return;
  writeQueue([]); // clear immediately so a crash mid-flush can't double-replay

  for (const action of queue) {
    try {
      if (action.type === 'awardXP') await awardXP(action.userId, action.amount, action.source, { skipQueueOnFail: true });
      else if (action.type === 'awardCoins') await awardCoins(action.userId, action.amount, { skipQueueOnFail: true });
      else if (action.type === 'saveGameProgress') await saveGameProgress(action.userId, action.gameName, action.payload, { skipQueueOnFail: true });
    } catch (e) {
      console.error('[gamification] offline replay failed, re-queueing:', e);
      queueOfflineAction(action); // put it back, try again next time
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushOfflineQueue(); });
}

// ============================================================
// PROFILE READ
// ============================================================
export async function loadGamificationProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await tbl('profiles').select('*').eq('user_id', userId).single();
  if (error) { console.error('[gamification] loadGamificationProfile error:', error.message); return null; }
  return data as Profile;
}

// ============================================================
// LEADERBOARD SYNC — kept in lockstep with XP changes so it never needs a
// separate manual update (Feature 13).
// ============================================================
async function syncLeaderboard(userId: string, displayName: string, xp: number, level: number, streak: number) {
  try {
    await tbl('leaderboard_entries').upsert({
      user_id: userId,
      display_name: displayName || 'Learner',
      xp,
      level,
      current_streak: streak,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  } catch (e) {
    console.error('[gamification] leaderboard sync failed (non-blocking):', e);
  }
}

// ============================================================
// AWARD XP — the ONLY place XP is ever added. Always increments,
// never overwrites. Recalculates level from total XP every time.
// ============================================================
export async function awardXP(
  userId: string,
  amount: number,
  source: string,
  opts: { skipQueueOnFail?: boolean } = {}
): Promise<{ xp: number; level: number; leveledUp: boolean } | null> {
  if (amount === 0) return null;
  try {
    const profile = await loadGamificationProfile(userId);
    if (!profile) return null;

    const newXP = Math.max(0, (profile.xp || 0) + amount);
    const { level } = calculateLevel(newXP);
    const leveledUp = level > (profile.level || 1);

    const { error } = await tbl('profiles')
      .update({ xp: newXP, level, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;

    // Fire-and-forget side effects — never block the XP award on these.
    tbl('activity_logs').insert({ user_id: userId, activity_type: 'xp', description: `+${amount} XP from ${source}`, xp_earned: amount }).then(() => {}, () => {});
    syncLeaderboard(userId, profile.display_name || 'Learner', newXP, level, profile.current_streak || 0);

    return { xp: newXP, level, leveledUp };
  } catch (e) {
    console.error('[gamification] awardXP failed:', e);
    if (!opts.skipQueueOnFail) queueOfflineAction({ type: 'awardXP', userId, amount, source, queuedAt: Date.now() });
    return null;
  }
}

// ============================================================
// AWARD COINS — always increments, never overwrites.
// ============================================================
export async function awardCoins(
  userId: string,
  amount: number,
  opts: { skipQueueOnFail?: boolean } = {}
): Promise<number | null> {
  if (amount === 0) return null;
  try {
    const profile = await loadGamificationProfile(userId);
    if (!profile) return null;
    const newCoins = Math.max(0, (profile.coins || 0) + amount);
    const { error } = await tbl('profiles')
      .update({ coins: newCoins, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
    return newCoins;
  } catch (e) {
    console.error('[gamification] awardCoins failed:', e);
    if (!opts.skipQueueOnFail) queueOfflineAction({ type: 'awardCoins', userId, amount, queuedAt: Date.now() });
    return null;
  }
}

// ============================================================
// STREAK — moved here from AuthContext so login flow and any other
// caller share one implementation (Feature 18: no duplicated logic).
// Same-day → no change. Next calendar day → +1. Missed a day → reset to 1.
// ============================================================
export async function updateStreak<T extends { current_streak: number; longest_streak: number; last_login_date: string | null }>(
  profile: T,
  userId: string
): Promise<T | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = profile.last_login_date;
    if (lastLogin === today) return profile; // already counted today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newStreak = lastLogin === yesterday ? (profile.current_streak || 0) + 1 : 1;
    const longestStreak = Math.max(newStreak, profile.longest_streak || 0);

    const { error } = await tbl('profiles').update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_login_date: today,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    if (error) { console.error('[gamification] updateStreak error:', error.message); return profile; }
    return { ...profile, current_streak: newStreak, longest_streak: longestStreak, last_login_date: today };
  } catch (e) {
    console.error('[gamification] updateStreak exception:', e);
    return profile;
  }
}

// ============================================================
// UNIVERSAL GAME PROGRESS — one row per (user, game_name). game_name is
// free text (the ActiveGame id from GamesPage, e.g. 'quiz', 'bughunt',
// 'coderace'...) so this works for every game without hardcoding names,
// including any game added later.
// ============================================================
export interface SaveGameProgressInput {
  score: number;
  xpEarned?: number;
  coinsEarned?: number;
  topic?: string;
  /** Exact question/step index the player is currently on. When provided
   *  this is stored as-is (so exiting mid-game and reopening resumes on
   *  the exact question, not just the last fully-finished round). Pass 0
   *  when a round is fully completed, so the next open starts fresh. */
  questionIndex?: number;
  /** Legacy behaviour when questionIndex isn't given: true (default)
   *  advances current_level by one attempt; false leaves it unchanged. */
  advanceLevel?: boolean;
  /** True for a lightweight "still playing, here's my current question"
   *  ping — skips bumping times_played/highest_score so exiting mid-game
   *  repeatedly doesn't inflate stats that should only change on an
   *  actual finished round. */
  isProgressPing?: boolean;
}

export async function loadGameProgress(userId: string, gameName: string): Promise<GameProgressRow | null> {
  const { data, error } = await tbl('game_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('game_name', gameName)
    .maybeSingle();
  if (error) { console.error('[gamification] loadGameProgress error:', error.message); return null; }
  return data as GameProgressRow | null;
}

/** Loads progress for every game at once — GamesPage uses this so every
 *  game card can show "Continue Level X" vs "Start Game" from one query. */
export async function loadAllGameProgress(userId: string): Promise<Record<string, GameProgressRow>> {
  const { data, error } = await tbl('game_progress').select('*').eq('user_id', userId);
  if (error) { console.error('[gamification] loadAllGameProgress error:', error.message); return {}; }
  const map: Record<string, GameProgressRow> = {};
  for (const row of (data || []) as GameProgressRow[]) map[row.game_name] = row;
  return map;
}

export async function saveGameProgress(
  userId: string,
  gameName: string,
  input: SaveGameProgressInput,
  opts: { skipQueueOnFail?: boolean } = {}
): Promise<GameProgressRow | null> {
  try {
    const existing = await loadGameProgress(userId, gameName);
    const advance = input.advanceLevel ?? true;
    const nextLevel = input.questionIndex !== undefined
      ? input.questionIndex
      : (advance ? (existing?.current_level || 1) + 1 : (existing?.current_level || 1));

    const row = {
      user_id: userId,
      game_name: gameName,
      current_level: nextLevel,
      highest_level: Math.max(nextLevel, existing?.highest_level || 1),
      current_score: input.isProgressPing ? (existing?.current_score || 0) : input.score,
      highest_score: input.isProgressPing ? (existing?.highest_score || 0) : Math.max(input.score, existing?.highest_score || 0),
      xp_earned: (existing?.xp_earned || 0) + (input.xpEarned || 0),
      coins_earned: (existing?.coins_earned || 0) + (input.coinsEarned || 0),
      last_topic: input.topic ?? existing?.last_topic ?? null,
      times_played: input.isProgressPing ? (existing?.times_played || 0) : (existing?.times_played || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await tbl('game_progress')
      .upsert(row, { onConflict: 'user_id,game_name' })
      .select()
      .single();
    if (error) throw error;
    return data as GameProgressRow;
  } catch (e) {
    console.error('[gamification] saveGameProgress failed:', e);
    if (!opts.skipQueueOnFail) queueOfflineAction({ type: 'saveGameProgress', userId, gameName, payload: input, queuedAt: Date.now() });
    return null;
  }
}

// ============================================================
// DUPLICATE-XP PREVENTION — used by quizzes, lessons AND games. Pass any
// stable, globally-unique question_id, e.g. `quiz-12-q3`, `lesson-45`,
// `bughunt-lvl2-q1`. Relies on a UNIQUE(user_id, question_id) DB
// constraint, so even two near-simultaneous calls can't double-award.
// ============================================================
export async function hasAnsweredQuestion(userId: string, questionId: string): Promise<boolean> {
  const { data, error } = await tbl('user_question_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();
  if (error) { console.error('[gamification] hasAnsweredQuestion error:', error.message); return false; }
  return !!data;
}

export interface SaveQuestionProgressInput {
  questionId: string;
  lessonId?: number;
  gameName?: string;
  selectedAnswer?: string;
  isCorrect: boolean;
  xpEarned: number;
}

/** Records the answer and returns whether XP should actually be awarded
 *  (false if this question was already solved before — the caller must
 *  skip awardXP/awardCoins in that case). */
export async function saveQuestionProgress(
  userId: string,
  input: SaveQuestionProgressInput
): Promise<{ alreadyAnswered: boolean }> {
  try {
    const { error } = await tbl('user_question_progress').insert({
      user_id: userId,
      question_id: input.questionId,
      lesson_id: input.lessonId ?? null,
      game_name: input.gameName ?? null,
      selected_answer: input.selectedAnswer ?? null,
      is_correct: input.isCorrect,
      xp_earned: input.isCorrect ? input.xpEarned : 0,
    });
    if (error) {
      // 23505 = unique_violation → already answered, this is expected, not a bug
      if (error.code === '23505') return { alreadyAnswered: true };
      console.error('[gamification] saveQuestionProgress error:', error.message);
    }
    return { alreadyAnswered: false };
  } catch (e) {
    console.error('[gamification] saveQuestionProgress exception:', e);
    return { alreadyAnswered: false };
  }
}

// ============================================================
// REALTIME SYNC — profile changes (from any tab/device) push straight to
// subscribers, so XP bar / coins / level badge update with no refresh.
// ============================================================
export function subscribeToProfile(userId: string, onChange: (profile: Profile) => void): () => void {
  const channel = supabase
    .channel(`profile-changes-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${userId}` },
      (payload) => onChange(payload.new as Profile)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
