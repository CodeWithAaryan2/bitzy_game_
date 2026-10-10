// ===============================================
// BITZY schema.ts PATCH (Premium Course System)
// Copy & paste into your existing db/schema.ts
// ===============================================

/*
1. Update imports:
   Add `jsonb` to drizzle imports.

2. Add these enums below chatRoleEnum.
*/

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "pending",
  "completed",
  "failed",
  "cancelled",
  "refunded",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "flat",
]);

/*
3. Add these fields inside `courses` table.
*/

isPaid: boolean("is_paid").default(false).notNull(),
price: integer("price").default(0).notNull(),
discountPrice: integer("discount_price").default(0).notNull(),
currency: varchar("currency", { length: 10 }).default("INR"),
thumbnail: text("thumbnail"),
previewVideo: text("preview_video"),
status: varchar("status", { length: 20 }).default("draft"),
totalSales: integer("total_sales").default(0).notNull(),
totalRevenue: integer("total_revenue").default(0).notNull(),
updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

/*
4. Paste these new tables at the end of schema.ts
*/

export const purchasedCourses = pgTable("purchased_courses", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }).notNull(),
  courseId: integer("course_id").notNull(),
  paymentId: text("payment_id"),
  orderId: text("order_id"),
  razorpaySignature: text("razorpay_signature"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: paymentStatusEnum("status").default("pending"),
  couponCode: varchar("coupon_code", { length: 50 }),
  discountAmount: integer("discount_amount").default(0),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).defaultNow(),
  unlockedAt: timestamp("unlocked_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number" }),
  courseId: integer("course_id"),
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).default("INR"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentGateway: varchar("payment_gateway", { length: 20 }).default("razorpay"),
  status: paymentStatusEnum("status").default("created"),
  refunded: boolean("refunded").default(false),
  refundAmount: integer("refund_amount").default(0),
  refundReason: text("refund_reason"),
  webhookReceived: boolean("webhook_received").default(false),
  notes: jsonb("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").default("percentage"),
  discountValue: integer("discount_value").notNull(),
  minimumPurchase: integer("minimum_purchase").default(0),
  maxDiscount: integer("max_discount"),
  usageLimit: integer("usage_limit").default(100),
  usedCount: integer("used_count").default(0),
  active: boolean("active").default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const revenueStats = pgTable("revenue_stats", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 20 }).notNull(),
  totalOrders: integer("total_orders").default(0),
  totalRevenue: integer("total_revenue").default(0),
  successfulPayments: integer("successful_payments").default(0),
  refundedPayments: integer("refunded_payments").default(0),
  failedPayments: integer("failed_payments").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
