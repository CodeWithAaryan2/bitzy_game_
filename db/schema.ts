import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  bigint,
  boolean,
  index,
  jsonb,
  date,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================
// ENUMS
// ============================================================
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const difficultyEnum = pgEnum("difficulty", ["Beginner", "Easy", "Medium", "Hard", "Expert"]);
export const challengeDifficultyEnum = pgEnum("challenge_difficulty", ["Easy", "Medium", "Hard"]);
export const questDifficultyEnum = pgEnum("quest_difficulty", ["Easy", "Medium", "Hard"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["reading", "video", "interactive", "coding"]);
export const submissionStatusEnum = pgEnum("submission_status", ["pending", "accepted", "wrong_answer", "time_limit", "runtime_error", "compilation_error"]);
export const achievementCategoryEnum = pgEnum("achievement_category", ["learning", "coding", "streak", "social", "special", "course", "challenge", "secret"]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

// ============================================================
// USERS (OAuth users from auth system)
// ============================================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// PROFILES -- Gamification data per user
// ============================================================
export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }),
  bio: text("bio"),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  coins: integer("coins").default(100).notNull(),
  energy: integer("energy").default(100).notNull(),
  maxEnergy: integer("maxEnergy").default(100).notNull(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  longestStreak: integer("longestStreak").default(0).notNull(),
  lastLoginDate: varchar("lastLoginDate", { length: 10 }),
  totalLessons: integer("totalLessons").default(0).notNull(),
  totalQuizzes: integer("totalQuizzes").default(0).notNull(),
  totalChallenges: integer("totalChallenges").default(0).notNull(),
  totalAchievements: integer("totalAchievements").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("profiles_userId_idx").on(table.userId),
]);

export type Profile = typeof profiles.$inferSelect;

// ============================================================
// COURSES
// ============================================================
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  longDescription: text("longDescription"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  difficulty: difficultyEnum("difficulty").default("Beginner").notNull(),
  category: varchar("category", { length: 50 }).default("Frontend"),
  tags: text("tags"),
  totalLessons: integer("totalLessons").default(0).notNull(),
  totalQuizzes: integer("totalQuizzes").default(0).notNull(),
  totalChallenges: integer("totalChallenges").default(0).notNull(),
  estimatedHours: integer("estimatedHours").default(0).notNull(),
  xpReward: integer("xpReward").default(500).notNull(),
  coinReward: integer("coinReward").default(250).notNull(),
  order: integer("order").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),

  // ── Premium course fields (added via manual SQL migration — see
  // db/premium_courses_migration.sql. Columns are snake_case to match
  // every other column this app actually reads/writes at runtime
  // (see src/lib/db.ts) — NOT the legacy camelCase columns above,
  // which is a pre-existing mismatch in this file, not something new. ──
  isPaid: boolean("is_paid").default(false).notNull(),
  price: integer("price").default(0).notNull(),
  discountPrice: integer("discount_price").default(0),
  currency: varchar("currency", { length: 10 }).default("INR").notNull(),
  thumbnail: text("thumbnail"),
  previewVideo: text("preview_video"),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // draft | published
  totalSales: integer("total_sales").default(0).notNull(),
  totalRevenue: integer("total_revenue").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;

// ============================================================
// MODULES
// ============================================================
export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  courseId: bigint("courseId", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: integer("order").default(0).notNull(),
  xpReward: integer("xpReward").default(50).notNull(),
  isBossModule: boolean("isBossModule").default(false).notNull(),
});

export type Module = typeof modules.$inferSelect;

// ============================================================
// LESSONS
// ============================================================
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  moduleId: bigint("moduleId", { mode: "number" }).notNull(),
  courseId: bigint("courseId", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  codeExamples: text("codeExamples"),
  type: lessonTypeEnum("type").default("reading").notNull(),
  xpReward: integer("xpReward").default(20).notNull(),
  coinReward: integer("coinReward").default(10).notNull(),
  energyCost: integer("energyCost").default(5).notNull(),
  estimatedMinutes: integer("estimatedMinutes").default(10).notNull(),
  order: integer("order").default(0).notNull(),
}, (table) => [
  index("lessons_courseId_idx").on(table.courseId),
  index("lessons_moduleId_idx").on(table.moduleId),
]);

export type Lesson = typeof lessons.$inferSelect;

// ============================================================
// QUIZZES
// ============================================================
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  lessonId: bigint("lessonId", { mode: "number" }).notNull(),
  courseId: bigint("courseId", { mode: "number" }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  questions: text("questions").notNull(),
  passingScore: integer("passingScore").default(70).notNull(),
  xpReward: integer("xpReward").default(50).notNull(),
  coinReward: integer("coinReward").default(25).notNull(),
});

export type Quiz = typeof quizzes.$inferSelect;

// ============================================================
// CHALLENGES
// ============================================================
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description").notNull(),
  difficulty: challengeDifficultyEnum("difficulty").default("Easy").notNull(),
  category: varchar("category", { length: 50 }).default("Arrays"),
  problemStatement: text("problemStatement").notNull(),
  constraints: text("constraints"),
  examples: text("examples"),
  starterCode: text("starterCode"),
  hints: text("hints"),
  testCases: text("testCases"),
  xpReward: integer("xpReward").default(50).notNull(),
  coinReward: integer("coinReward").default(25).notNull(),
  solveCount: integer("solveCount").default(0).notNull(),
  attemptCount: integer("attemptCount").default(0).notNull(),
}, (table) => [
  index("challenges_difficulty_idx").on(table.difficulty),
]);

export type Challenge = typeof challenges.$inferSelect;

// ============================================================
// ACHIEVEMENTS
// ============================================================
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: achievementCategoryEnum("category").default("learning").notNull(),
  icon: varchar("icon", { length: 50 }).default("Star"),
  color: varchar("color", { length: 20 }).default("#6366f1"),
  requirementType: varchar("requirementType", { length: 50 }).default("lessons_completed"),
  requirementCount: integer("requirementCount").default(1).notNull(),
  xpReward: integer("xpReward").default(0).notNull(),
  coinReward: integer("coinReward").default(0).notNull(),
  isSecret: boolean("isSecret").default(false).notNull(),
});

export type Achievement = typeof achievements.$inferSelect;

// ============================================================
// USER ACHIEVEMENTS
// ============================================================
export const userAchievements = pgTable("userAchievements", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  achievementId: bigint("achievementId", { mode: "number" }).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt", { withTimezone: true }),
  progress: integer("progress").default(0).notNull(),
}, (table) => [
  index("ua_userId_idx").on(table.userId),
]);

export type UserAchievement = typeof userAchievements.$inferSelect;

// ============================================================
// COURSE PROGRESS
// ============================================================
export const courseProgress = pgTable("courseProgress", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  courseId: bigint("courseId", { mode: "number" }).notNull(),
  completedLessons: text("completedLessons"),
  completedQuizzes: text("completedQuizzes"),
  completedChallenges: text("completedChallenges"),
  currentLessonId: varchar("currentLessonId", { length: 20 }),
  overallProgress: integer("overallProgress").default(0).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("cp_userId_idx").on(table.userId),
  index("cp_courseId_idx").on(table.courseId),
]);

export type CourseProgress = typeof courseProgress.$inferSelect;

// ============================================================
// CODE SUBMISSIONS
// ============================================================
export const codeSubmissions = pgTable("codeSubmissions", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  challengeId: bigint("challengeId", { mode: "number" }).notNull(),
  language: varchar("language", { length: 30 }).default("javascript").notNull(),
  sourceCode: text("sourceCode"),
  status: submissionStatusEnum("status").default("pending").notNull(),
  testResults: text("testResults"),
  xpAwarded: integer("xpAwarded").default(0).notNull(),
  coinsAwarded: integer("coinsAwarded").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("cs_userId_idx").on(table.userId),
]);

export type CodeSubmission = typeof codeSubmissions.$inferSelect;

// ============================================================
// DAILY QUESTS
// ============================================================
export const dailyQuests = pgTable("dailyQuests", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  questType: varchar("questType", { length: 50 }).default("complete_lessons"),
  requirement: integer("requirement").default(1).notNull(),
  xpReward: integer("xpReward").default(50).notNull(),
  coinReward: integer("coinReward").default(25).notNull(),
  difficulty: questDifficultyEnum("difficulty").default("Easy").notNull(),
  icon: varchar("icon", { length: 50 }).default("Target"),
});

export type DailyQuest = typeof dailyQuests.$inferSelect;

// ============================================================
// USER DAILY QUESTS
// ============================================================
export const userDailyQuests = pgTable("userDailyQuests", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  questId: bigint("questId", { mode: "number" }).notNull(),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  assignedAt: varchar("assignedAt", { length: 10 }).notNull(),
}, (table) => [
  index("udq_userId_idx").on(table.userId),
]);

export type UserDailyQuest = typeof userDailyQuests.$inferSelect;

// ============================================================
// ACTIVITY LOGS
// ============================================================
export const activityLogs = pgTable("activityLogs", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  activityType: varchar("activityType", { length: 50 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  xpEarned: integer("xpEarned").default(0).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("al_userId_idx").on(table.userId),
]);

export type ActivityLog = typeof activityLogs.$inferSelect;

// ============================================================
// LEADERBOARD ENTRIES
// ============================================================
export const leaderboardEntries = pgTable("leaderboardEntries", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  level: integer("level").default(1).notNull(),
  xp: integer("xp").default(0).notNull(),
  weeklyXp: integer("weeklyXp").default(0).notNull(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  challengesSolved: integer("challengesSolved").default(0).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("le_userId_idx").on(table.userId),
  index("le_xp_idx").on(table.xp),
]);

export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

// ============================================================
// CHAT MESSAGES (AI Mentor)
// ============================================================
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  userId: bigint("userId", { mode: "number" }).notNull(),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("cm_userId_idx").on(table.userId),
]);

export type ChatMessage = typeof chatMessages.$inferSelect;

// ============================================================
// PAYMENTS / PREMIUM COURSES
// Matches db/003_payment_system.sql (the migration you actually ran)
// EXACTLY — field names, types (integer rupees, not decimal), defaults.
// ROOT-CAUSE FLAG: that SQL points user_id at `users(id)` (the dead
// legacy bigint table from the old OAuth system — see
// api/queries/users.ts). Every other real table in this app
// (db/schema.sql, features_migration.sql, migration_gamification.sql)
// points user_id at `auth.users(id)` (uuid) instead, because that's
// what Supabase Auth + profiles.user_id actually use. As written,
// inserting a real logged-in user's id into payments/purchased_courses
// will throw a foreign key violation, every time, for every buyer.
// Fix (run this before going live):
//   ALTER TABLE payments DROP CONSTRAINT payments_user_id_fkey,
//     ALTER COLUMN user_id TYPE uuid USING NULL,
//     ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
//   -- same for purchased_courses.user_id
// Schema below (and the routers using it) already assume that fix is
// applied — user_id typed as uuid, not bigint.
// ============================================================
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id"),
  courseId: integer("course_id"),
  razorpayOrderId: text("razorpay_order_id").notNull().unique(),
  razorpayPaymentId: text("razorpay_payment_id").unique(),
  razorpaySignature: text("razorpay_signature"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentGateway: varchar("payment_gateway", { length: 20 }).default("razorpay"),
  status: varchar("status", { length: 20 }).default("created"),
  refunded: boolean("refunded").default(false),
  refundAmount: integer("refund_amount").default(0),
  refundReason: text("refund_reason"),
  webhookReceived: boolean("webhook_received").default(false),
  notes: jsonb("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  paidAt: timestamp("paid_at"),
}, (table) => [
  index("idx_payment_user").on(table.userId),
  index("idx_payment_status").on(table.status),
]);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const purchasedCourses = pgTable("purchased_courses", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  courseId: integer("course_id").notNull(),
  paymentId: text("payment_id").unique(), // razorpay payment id (text), NOT payments.id
  orderId: text("order_id").unique(), // razorpay order id
  razorpaySignature: text("razorpay_signature"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: varchar("status", { length: 20 }).default("pending"),
  couponCode: varchar("coupon_code", { length: 50 }),
  discountAmount: integer("discount_amount").default(0),
  purchasedAt: timestamp("purchased_at").defaultNow(),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_purchase_user").on(table.userId),
  index("idx_purchase_course").on(table.courseId),
  index("idx_purchase_status").on(table.status),
]);

export type PurchasedCourse = typeof purchasedCourses.$inferSelect;
export type InsertPurchasedCourse = typeof purchasedCourses.$inferInsert;

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  discountType: varchar("discount_type", { length: 20 }).default("percentage"), // "percentage" | "flat"
  discountValue: integer("discount_value").notNull(),
  minimumPurchase: integer("minimum_purchase").default(0),
  maxDiscount: integer("max_discount"),
  usageLimit: integer("usage_limit").default(100),
  usedCount: integer("used_count").default(0),
  active: boolean("active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

export const revenueStats = pgTable("revenue_stats", {
  id: serial("id").primaryKey(),
  date: date("date").unique(),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: integer("total_revenue").default(0),
  successfulPayments: integer("successful_payments").default(0),
  refundedPayments: integer("refunded_payments").default(0),
  failedPayments: integer("failed_payments").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type RevenueStat = typeof revenueStats.$inferSelect;
