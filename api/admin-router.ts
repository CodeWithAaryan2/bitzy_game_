/**
 * admin-router.ts
 * All endpoints here check that the caller's email === ADMIN_EMAIL
 * (or their profile role === 'admin') before executing.
 *
 * Add to api/router.ts:
 *   import { adminRouter } from "./admin-router";
 *   ...
 *   admin: adminRouter,
 */
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

const ADMIN_EMAIL = "aaryanpandeyop@gmail.com";

/** Shared guard — throws if caller is not admin */
async function requireAdmin(req: Request) {
  const db = getDb();
  // Supabase JWT lives in Authorization header
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");
  const email = user.email ?? "";
  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    // Also accept role=admin in profiles table as a fallback
    const { data: profile } = await db
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (profile?.role !== "admin") throw new Error("Forbidden");
  }
}

// ─────────────────────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────────────────────
const courseSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  difficulty: z.enum(["Beginner", "Easy", "Medium", "Hard", "Expert"]),
  category: z.string().optional(),
  tags: z.string().optional(),
  estimatedHours: z.number().int().default(0),
  xpReward: z.number().int().default(500),
  coinReward: z.number().int().default(250),
  order: z.number().int().default(0),
});

// ─────────────────────────────────────────────────────────────
// QUIZZES
// ─────────────────────────────────────────────────────────────
const quizSchema = z.object({
  lessonId: z.number().int(),
  courseId: z.number().int(),
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.string(), // JSON string
  passingScore: z.number().int().default(70),
  xpReward: z.number().int().default(50),
  coinReward: z.number().int().default(25),
});

// ─────────────────────────────────────────────────────────────
// CHALLENGES
// ─────────────────────────────────────────────────────────────
const challengeSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  category: z.string().optional(),
  problemStatement: z.string(),
  constraints: z.string().optional(),
  examples: z.string().optional(),
  starterCode: z.string().optional(),
  hints: z.string().optional(),
  testCases: z.string().optional(),
  xpReward: z.number().int().default(50),
  coinReward: z.number().int().default(25),
});

// ─────────────────────────────────────────────────────────────
// GAME LEVELS
// ─────────────────────────────────────────────────────────────
const gameLevelSchema = z.object({
  title: z.string().min(1),
  topic: z.string().default("javascript"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  game_type: z.enum(["quiz", "fillblank", "prediction", "bughunt", "codeorder", "truthy"]),
  questions: z.string(), // JSON string of question array
  xp_reward: z.number().int().default(50),
  coin_reward: z.number().int().default(25),
  order: z.number().int().default(0),
});

export const adminRouter = createRouter({
  // ─── COURSES ───────────────────────────────────────────────
  listCourses: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx.req);
    const db = getDb();
    const { data } = await db.from("courses").select("*").order("order", { ascending: true });
    return data ?? [];
  }),

  createCourse: publicQuery
    .input(courseSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("courses").insert({ ...input, isPublished: false }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  updateCourse: publicQuery
    .input(z.object({ id: z.number(), updates: courseSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("courses").update(input.updates).eq("id", input.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  deleteCourse: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { error } = await db.from("courses").delete().eq("id", input.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  toggleCoursePublish: publicQuery
    .input(z.object({ id: z.number(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db
        .from("courses")
        .update({ isPublished: input.isPublished })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  // ─── QUIZZES ───────────────────────────────────────────────
  listQuizzes: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx.req);
    const db = getDb();
    const { data } = await db.from("quizzes").select("*").order("id", { ascending: true });
    return data ?? [];
  }),

  createQuiz: publicQuery
    .input(quizSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("quizzes").insert({ ...input, isPublished: false }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  updateQuiz: publicQuery
    .input(z.object({ id: z.number(), updates: quizSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("quizzes").update(input.updates).eq("id", input.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  deleteQuiz: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { error } = await db.from("quizzes").delete().eq("id", input.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  toggleQuizPublish: publicQuery
    .input(z.object({ id: z.number(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db
        .from("quizzes")
        .update({ isPublished: input.isPublished })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  // ─── CHALLENGES ────────────────────────────────────────────
  listChallenges: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx.req);
    const db = getDb();
    const { data } = await db.from("challenges").select("*").order("id", { ascending: true });
    return data ?? [];
  }),

  createChallenge: publicQuery
    .input(challengeSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("challenges").insert({ ...input, isPublished: false }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  updateChallenge: publicQuery
    .input(z.object({ id: z.number(), updates: challengeSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("challenges").update(input.updates).eq("id", input.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  deleteChallenge: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { error } = await db.from("challenges").delete().eq("id", input.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  toggleChallengePublish: publicQuery
    .input(z.object({ id: z.number(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db
        .from("challenges")
        .update({ isPublished: input.isPublished })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  // ─── GAME LEVELS ───────────────────────────────────────────
  listGameLevels: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx.req);
    const db = getDb();
    const { data } = await db.from("game_levels").select("*").order("order", { ascending: true });
    return data ?? [];
  }),

  createGameLevel: publicQuery
    .input(gameLevelSchema)
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("game_levels").insert({ ...input, isPublished: false }).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  updateGameLevel: publicQuery
    .input(z.object({ id: z.number(), updates: gameLevelSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db.from("game_levels").update(input.updates).eq("id", input.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }),

  deleteGameLevel: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { error } = await db.from("game_levels").delete().eq("id", input.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  toggleGameLevelPublish: publicQuery
    .input(z.object({ id: z.number(), isPublished: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db
        .from("game_levels")
        .update({ isPublished: input.isPublished })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  // ─── PREMIUM COURSES ────────────────────────────────────────
  // Matches db/003_payment_system.sql: price/discount_price are
  // integer rupees (not decimal). createCourse / toggleCoursePublish
  // above still use camelCase ("isPublished") against this same table
  // while the real column is snake_case ("is_published", per
  // src/lib/db.ts) — pre-existing mismatch, flagging not fixing.
  updateCoursePricing: publicQuery
    .input(
      z.object({
        id: z.number().int(),
        isPaid: z.boolean(),
        price: z.number().int().min(0),
        discountPrice: z.number().int().min(0).nullable().optional(),
        currency: z.string().default("INR"),
        thumbnail: z.string().nullable().optional(),
        previewVideo: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db
        .from("courses")
        .update({
          is_paid: input.isPaid,
          price: input.price,
          discount_price: input.discountPrice ?? 0,
          currency: input.currency,
          thumbnail: input.thumbnail ?? null,
          preview_video: input.previewVideo ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  setCourseStatus: publicQuery
    .input(z.object({ id: z.number().int(), status: z.enum(["draft", "published"]) }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db
        .from("courses")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  // ─── COUPONS ────────────────────────────────────────────────
  // Matches db/003_payment_system.sql: discount_value/minimum_purchase/
  // max_discount are integer rupees, `active` (not is_active),
  // `expires_at` (not expiry_date). No per-course scoping column exists
  // in that table — coupons apply to every paid course.
  listCoupons: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx.req);
    const db = getDb();
    const { data } = await db.from("coupons").select("*").order("created_at", { ascending: false });
    return data ?? [];
  }),

  createCoupon: publicQuery
    .input(
      z.object({
        code: z.string().min(1),
        title: z.string().optional(),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "flat"]).default("percentage"),
        discountValue: z.number().int().positive(),
        maxDiscount: z.number().int().positive().nullable().optional(),
        minimumPurchase: z.number().int().min(0).default(0),
        usageLimit: z.number().int().positive().default(100),
        expiresAt: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { data, error } = await db
        .from("coupons")
        .insert({
          code: input.code.trim().toUpperCase(),
          title: input.title ?? null,
          description: input.description ?? null,
          discount_type: input.discountType,
          discount_value: input.discountValue,
          max_discount: input.maxDiscount ?? null,
          minimum_purchase: input.minimumPurchase,
          usage_limit: input.usageLimit,
          expires_at: input.expiresAt ?? null,
          active: true,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  toggleCouponActive: publicQuery
    .input(z.object({ id: z.number().int(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { error } = await db.from("coupons").update({ active: input.active }).eq("id", input.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  deleteCoupon: publicQuery
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      const { error } = await db.from("coupons").delete().eq("id", input.id);
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  // ─── PAYMENTS / REVENUE ─────────────────────────────────────
  listPayments: publicQuery
    .input(
      z.object({
        status: z.enum(["created", "captured", "failed", "refunded"]).optional(),
        search: z.string().optional(), // matches razorpay_order_id / razorpay_payment_id
        limit: z.number().int().min(1).max(200).default(50),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getDb();
      let q = db
        .from("payments")
        .select("*, courses(title, slug)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);
      if (input.status) q = q.eq("status", input.status);
      if (input.search) {
        q = q.or(`razorpay_order_id.ilike.%${input.search}%,razorpay_payment_id.ilike.%${input.search}%`);
      }
      const { data, count, error } = await q;
      if (error) throw new Error(error.message);
      return { payments: data ?? [], total: count ?? 0 };
    }),

  // Matches db/003_payment_system.sql revenue_stats: total_revenue is
  // integer rupees; refund totals come from summing payments.refund_amount
  // directly since revenue_stats only tracks a refunded_payments *count*.
  revenueSummary: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx.req);
    const db = getDb();
    const todayStr = new Date().toISOString().slice(0, 10);
    const monthStart = `${todayStr.slice(0, 7)}-01`;

    const [{ data: today }, { data: monthRows }, { data: allTime }, { data: refunds }, statusCounts] =
      await Promise.all([
        db.from("revenue_stats").select("*").eq("date", todayStr).single(),
        db.from("revenue_stats").select("*").gte("date", monthStart).lte("date", todayStr),
        db.from("revenue_stats").select("total_revenue, total_orders"),
        db.from("payments").select("refund_amount").eq("status", "refunded"),
        Promise.all(
          (["created", "captured", "failed", "refunded"] as const).map(async (status) => {
            const { count } = await db.from("payments").select("*", { count: "exact", head: true }).eq("status", status);
            return [status, count ?? 0] as const;
          }),
        ),
      ]);

    const monthRevenue = (monthRows ?? []).reduce((sum, r) => sum + (r.total_revenue ?? 0), 0);
    const monthOrders = (monthRows ?? []).reduce((sum, r) => sum + (r.total_orders ?? 0), 0);
    const totalRevenue = (allTime ?? []).reduce((sum, r) => sum + (r.total_revenue ?? 0), 0);
    const totalRefundAmount = (refunds ?? []).reduce((sum, r) => sum + (r.refund_amount ?? 0), 0);

    const { data: topCourses } = await db
      .from("courses")
      .select("id, title, total_sales, total_revenue")
      .eq("is_paid", true)
      .order("total_revenue", { ascending: false })
      .limit(5);

    return {
      todayRevenue: today?.total_revenue ?? 0,
      todayOrders: today?.total_orders ?? 0,
      monthRevenue,
      monthOrders,
      totalRevenue,
      totalRefundAmount,
      statusCounts: Object.fromEntries(statusCounts),
      topCourses: topCourses ?? [],
    };
  }),

  // ─── STATS (dashboard numbers) ─────────────────────────────
  stats: publicQuery.query(async ({ ctx }) => {
    await requireAdmin(ctx.req);
    const db = getDb();
    const [{ count: users }, { count: courses }, { count: quizzes }, { count: challenges }, { count: gameLevels }] =
      await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("courses").select("*", { count: "exact", head: true }),
        db.from("quizzes").select("*", { count: "exact", head: true }),
        db.from("challenges").select("*", { count: "exact", head: true }),
        db.from("game_levels").select("*", { count: "exact", head: true }),
      ]);
    return { users, courses, quizzes, challenges, gameLevels };
  }),
});