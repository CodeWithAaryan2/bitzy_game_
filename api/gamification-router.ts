import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

function getXPForLevel(level: number): number {
  if (level <= 1) return 100;
  if (level <= 10) return 100 * level;
  if (level <= 25) return 500 + 200 * (level - 10);
  if (level <= 50) return 3500 + 500 * (level - 25);
  if (level <= 75) return 16000 + 1000 * (level - 50);
  if (level <= 90) return 41000 + 2000 * (level - 75);
  return 71000 + 5000 * (level - 90);
}

function getLevelFromXP(xp: number): { level: number; currentLevelXP: number; xpToNext: number } {
  let cumulative = 0;
  let level = 1;
  while (level < 100) {
    const needed = getXPForLevel(level + 1);
    if (cumulative + needed > xp) {
      return { level, currentLevelXP: xp - cumulative, xpToNext: needed - (xp - cumulative) };
    }
    cumulative += needed;
    level++;
  }
  return { level: 100, currentLevelXP: 0, xpToNext: 0 };
}

// Default user ID for local auth (no OAuth)
const DEFAULT_USER_ID = 1;

export const gamificationRouter = createRouter({
  // -- Profile --
  getProfile: publicQuery.query(async () => {
    const db = getDb();
    const { data: profile, error } = await db
      .from("profiles")
      .select("*")
      .eq("userId", DEFAULT_USER_ID)
      .single();

    if (error || !profile) {
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      await db.from("profiles").insert({
        userId: DEFAULT_USER_ID,
        displayName: "Learner",
        bio: "Learning to code one day at a time!",
        lastLoginDate: dateStr,
      } as any);
      const { data: newProfile } = await db
        .from("profiles")
        .select("*")
        .eq("userId", DEFAULT_USER_ID)
        .single();
      return newProfile;
    }
    return profile;
  }),

  updateProfile: publicQuery
    .input(z.object({ displayName: z.string().optional(), bio: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.from("profiles").update({ ...input, updatedAt: new Date().toISOString() } as any).eq("userId", DEFAULT_USER_ID);
      return { success: true };
    }),

  // -- XP / Coins --
  addXP: publicQuery
    .input(z.object({ amount: z.number(), source: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { data: profile } = await db
        .from("profiles")
        .select("*")
        .eq("userId", DEFAULT_USER_ID)
        .single();
      if (!profile) return { success: false };

      const prof = profile as any;
      const newXP = prof.xp + input.amount;
      const levelInfo = getLevelFromXP(newXP);
      const newLevel = levelInfo.level > prof.level ? levelInfo.level : prof.level;

      await db.from("profiles")
        .update({ xp: newXP, level: newLevel, updatedAt: new Date().toISOString() } as any)
        .eq("userId", DEFAULT_USER_ID);

      await db.from("activityLogs").insert({
        userId: DEFAULT_USER_ID,
        activityType: "xp",
        description: `+${input.amount} XP from ${input.source}`,
        xpEarned: input.amount,
      } as any);

      return { success: true, newXP, newLevel, levelUp: newLevel > prof.level };
    }),

  addCoins: publicQuery
    .input(z.object({ amount: z.number(), source: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { data: profile } = await db
        .from("profiles")
        .select("coins")
        .eq("userId", DEFAULT_USER_ID)
        .single();
      const coins = (profile as any)?.coins || 0;
      await db.from("profiles")
        .update({ coins: coins + input.amount, updatedAt: new Date().toISOString() } as any)
        .eq("userId", DEFAULT_USER_ID);
      return { success: true };
    }),

  spendEnergy: publicQuery
    .input(z.object({ amount: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { data: profile } = await db
        .from("profiles")
        .select("energy")
        .eq("userId", DEFAULT_USER_ID)
        .single();
      const energy = (profile as any)?.energy || 0;
      if (!profile || energy < input.amount) return { success: false, error: "Not enough energy" };
      await db.from("profiles").update({ energy: energy - input.amount } as any).eq("userId", DEFAULT_USER_ID);
      return { success: true };
    }),

  // -- Course Progress --
  getProgress: publicQuery.query(async () => {
    const db = getDb();
    const { data } = await db
      .from("courseProgress")
      .select("*")
      .eq("userId", DEFAULT_USER_ID);
    return data ?? [];
  }),

  completeLesson: publicQuery
    .input(z.object({ courseId: z.number(), lessonId: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { data: existing } = await db
        .from("courseProgress")
        .select("*")
        .eq("userId", DEFAULT_USER_ID)
        .eq("courseId", input.courseId)
        .single();

      if (existing) {
        const ex = existing as any;
        const completed = JSON.parse(ex.completedLessons || "[]") as string[];
        if (!completed.includes(input.lessonId)) {
          completed.push(input.lessonId);
          await db.from("courseProgress")
            .update({ completedLessons: JSON.stringify(completed), currentLessonId: input.lessonId } as any)
            .eq("id", ex.id);
        }
      } else {
        await db.from("courseProgress").insert({
          userId: DEFAULT_USER_ID,
          courseId: input.courseId,
          completedLessons: JSON.stringify([input.lessonId]),
          currentLessonId: input.lessonId,
          overallProgress: 5,
        } as any);
      }

      const { data: profile } = await db
        .from("profiles")
        .select("totalLessons")
        .eq("userId", DEFAULT_USER_ID)
        .single();
      const total = (profile as any)?.totalLessons || 0;
      await db.from("profiles")
        .update({ totalLessons: total + 1 } as any)
        .eq("userId", DEFAULT_USER_ID);

      return { success: true };
    }),

  // -- Achievements --
  getAchievements: publicQuery.query(async () => {
    const db = getDb();
    const { data: allAchievements } = await db.from("achievements").select("*");
    const { data: userAchs } = await db.from("userAchievements").select("*").eq("userId", DEFAULT_USER_ID);
    return {
      achievements: allAchievements ?? [],
      userAchievements: userAchs ?? [],
    };
  }),

  checkAchievements: publicQuery.mutation(async () => {
    const db = getDb();
    const { data: profileData } = await db.from("profiles").select("*").eq("userId", DEFAULT_USER_ID).single();
    if (!profileData) return [];

    const profile = profileData as any;
    const { data: allAchs } = await db.from("achievements").select("*");
    const { data: userAchs } = await db.from("userAchievements").select("*").eq("userId", DEFAULT_USER_ID);
    const newlyCompleted: number[] = [];

    for (const ach of (allAchs ?? [])) {
      const achAny = ach as any;
      const existing = (userAchs ?? []).find((ua: any) => ua.achievementId === achAny.id);
      if (existing?.completed) continue;

      let shouldComplete = false;
      const reqCount = achAny.requirementCount;

      switch (achAny.requirementType) {
        case "lessons_completed": shouldComplete = profile.totalLessons >= reqCount; break;
        case "quizzes_completed": shouldComplete = profile.totalQuizzes >= reqCount; break;
        case "challenges_solved": shouldComplete = profile.totalChallenges >= reqCount; break;
        case "streak_days": shouldComplete = profile.currentStreak >= reqCount; break;
        case "course_completed": shouldComplete = profile.totalLessons >= reqCount; break;
        case "quests_completed": shouldComplete = profile.totalQuizzes >= reqCount; break;
        case "profile_complete": shouldComplete = !!profile.displayName && !!profile.bio; break;
      }

      if (shouldComplete) {
        if (existing) {
          await db.from("userAchievements")
            .update({ completed: true, completedAt: new Date().toISOString() } as any)
            .eq("id", (existing as any).id);
        } else {
          await db.from("userAchievements").insert({
            userId: DEFAULT_USER_ID,
            achievementId: achAny.id,
            completed: true,
            completedAt: new Date().toISOString(),
          } as any);
        }
        newlyCompleted.push(achAny.id);

        await db.from("profiles")
          .update({ xp: profile.xp + achAny.xpReward, coins: profile.coins + achAny.coinReward } as any)
          .eq("userId", DEFAULT_USER_ID);
      }
    }

    return newlyCompleted;
  }),

  // -- Daily Quests --
  getDailyQuests: publicQuery.query(async () => {
    const db = getDb();
    const today = new Date().toISOString().split("T")[0];

    let { data: userQuests } = await db
      .from("userDailyQuests")
      .select("*")
      .eq("userId", DEFAULT_USER_ID);

    if (!userQuests || userQuests.length === 0 || !userQuests.every((q: any) => q.assignedAt === today)) {
      await db.from("userDailyQuests").delete().eq("userId", DEFAULT_USER_ID);

      const { data: quests } = await db.from("dailyQuests").select("*").limit(5);
      for (const q of (quests ?? [])) {
        await db.from("userDailyQuests").insert({
          userId: DEFAULT_USER_ID,
          questId: (q as any).id,
          assignedAt: today,
        } as any);
      }
      const { data: refreshed } = await db
        .from("userDailyQuests")
        .select("*")
        .eq("userId", DEFAULT_USER_ID);
      userQuests = refreshed ?? [];
    }

    const { data: quests } = await db.from("dailyQuests").select("*");
    return (userQuests ?? []).map((uq: any) => ({
      ...uq,
      quest: (quests ?? []).find((q: any) => (q as any).id === uq.questId),
    }));
  }),

  claimQuest: publicQuery
    .input(z.object({ questId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const { data: uq } = await db
        .from("userDailyQuests")
        .select("*")
        .eq("userId", DEFAULT_USER_ID)
        .eq("questId", input.questId)
        .single();

      const uqAny = uq as any;
      if (!uqAny || !uqAny.completed || uqAny.claimed) return { success: false };

      await db.from("userDailyQuests").update({ claimed: true } as any).eq("id", uqAny.id);
      return { success: true };
    }),

  // -- Leaderboard --
  getLeaderboard: publicQuery.query(async () => {
    const db = getDb();
    const { data } = await db
      .from("leaderboardEntries")
      .select("*")
      .order("xp", { ascending: false })
      .limit(50);
    return data ?? [];
  }),

  updateLeaderboard: publicQuery.mutation(async () => {
    const db = getDb();
    const { data: profileData } = await db.from("profiles").select("*").eq("userId", DEFAULT_USER_ID).single();
    if (!profileData) return;

    const profile = profileData as any;
    const { data: existing } = await db
      .from("leaderboardEntries")
      .select("*")
      .eq("userId", DEFAULT_USER_ID)
      .single();

    if (existing) {
      await db.from("leaderboardEntries").update({
        username: profile.displayName || "Learner",
        level: profile.level,
        xp: profile.xp,
        currentStreak: profile.currentStreak,
        challengesSolved: profile.totalChallenges,
      } as any).eq("id", (existing as any).id);
    } else {
      await db.from("leaderboardEntries").insert({
        userId: DEFAULT_USER_ID,
        username: profile.displayName || "Learner",
        level: profile.level,
        xp: profile.xp,
        currentStreak: profile.currentStreak,
        challengesSolved: profile.totalChallenges,
      } as any);
    }
  }),

  // -- Activity Log --
  getActivityLog: publicQuery.query(async () => {
    const db = getDb();
    const { data } = await db
      .from("activityLogs")
      .select("*")
      .eq("userId", DEFAULT_USER_ID)
      .order("createdAt", { ascending: false })
      .limit(20);
    return data ?? [];
  }),
});
