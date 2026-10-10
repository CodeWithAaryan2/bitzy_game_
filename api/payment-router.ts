import { z } from "zod";
import crypto from "crypto";
import Razorpay from "razorpay";
import { createRouter, publicQuery } from "./middleware";
import { getDb, getServiceDb } from "./queries/connection";
import { env } from "./lib/env";

function getRazorpay() {
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
}

async function requireUser(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!token) throw new Error("Unauthorized");
  const db = getDb(token);
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");
  return { user, token, db };
}

async function requireAdmin(req: Request) {
  const { user, token, db } = await requireUser(req);
  const ADMIN_EMAIL = "aaryanpandeyop@gmail.com";
  if ((user.email ?? "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Forbidden");
  }
  return { user, token, db };
}

const toPaise = (rupees: number) => Math.round(rupees * 100);

async function computePrice(courseId: number, couponCode?: string) {
  const db = getServiceDb();
  const { data: course, error } = await db
    .from("courses")
    .select("id, title, is_paid, price, discount_price, currency")
    .eq("id", courseId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!course) throw new Error("Course not found");
  if (!course.is_paid) throw new Error("This course is free — no payment needed");

  const basePrice = course.discount_price > 0 ? course.discount_price : course.price;
  let finalPrice = basePrice;
  let discountAmount = 0;
  let appliedCoupon: string | null = null;

  if (couponCode) {
    const { data: coupon } = await db
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (!coupon) throw new Error("Invalid coupon code");
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error("Coupon has expired");
    if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
      throw new Error("Coupon usage limit reached");
    }
    if (coupon.minimum_purchase && basePrice < coupon.minimum_purchase) {
      throw new Error(`Coupon requires a minimum purchase of ${coupon.minimum_purchase}`);
    }

    discountAmount =
      coupon.discount_type === "percentage"
        ? Math.round((basePrice * coupon.discount_value) / 100)
        : coupon.discount_value;
    if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount);
    discountAmount = Math.min(discountAmount, basePrice - 1);
    finalPrice = basePrice - discountAmount;
    appliedCoupon = coupon.code;
  }

  return { course, basePrice, discountAmount, finalPrice: Math.max(finalPrice, 1), appliedCoupon };
}

export const paymentRouter = createRouter({
  applyCoupon: publicQuery
    .input(z.object({ courseId: z.number().int(), couponCode: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await requireUser(ctx.req);
      const { basePrice, discountAmount, finalPrice, appliedCoupon } = await computePrice(
        input.courseId,
        input.couponCode,
      );
      return { basePrice, discountAmount, finalPrice, appliedCoupon };
    }),

  createOrder: publicQuery
    .input(z.object({ courseId: z.number().int(), couponCode: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { user, db } = await requireUser(ctx.req);

      const { data: existing } = await db
        .from("purchased_courses")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", input.courseId)
        .maybeSingle();
      if (existing) throw new Error("You already own this course");

      const { course, basePrice, discountAmount, finalPrice, appliedCoupon } = await computePrice(
        input.courseId,
        input.couponCode,
      );

      const razorpay = getRazorpay();
      const receipt = `bitzy_${input.courseId}_${Date.now()}`;
      const order = await razorpay.orders.create({
        amount: toPaise(finalPrice),
        currency: course.currency || "INR",
        receipt,
        notes: { courseId: String(input.courseId), userId: user.id, couponCode: appliedCoupon ?? "" },
      });

      const { error: insertError } = await db.from("payments").insert({
        user_id: user.id,
        course_id: input.courseId,
        amount: basePrice,
        final_amount: finalPrice,
        currency: course.currency || "INR",
        status: "created",
        order_id: order.id,
        razorpay_order_id: order.id,
        receipt,
        coupon_code: appliedCoupon,
        discount_amount: discountAmount,
        payment_gateway: "razorpay",
      });
      if (insertError) throw new Error(insertError.message);

      return {
        orderId: order.id,
        amount: toPaise(finalPrice),
        currency: course.currency || "INR",
        keyId: env.razorpayKeyId,
        courseTitle: course.title,
        basePrice,
        discountAmount,
        finalPrice,
        couponCode: appliedCoupon,
      };
    }),

  verifyPayment: publicQuery
    .input(
      z.object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { user, db } = await requireUser(ctx.req);

      const expectedSignature = crypto
        .createHmac("sha256", env.razorpayKeySecret)
        .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== input.razorpay_signature) {
        await db.from("payments").update({ status: "failed" }).eq("razorpay_order_id", input.razorpay_order_id);
        throw new Error("Payment signature verification failed");
      }

      const { data: payment, error } = await db
        .from("payments")
        .select("*")
        .eq("razorpay_order_id", input.razorpay_order_id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!payment) throw new Error("Order not found");
      if (payment.user_id !== user.id) throw new Error("Forbidden");

      await unlockCourse(payment, input.razorpay_payment_id, input.razorpay_signature);
      return { success: true, courseId: payment.course_id };
    }),

  paymentHistory: publicQuery.query(async ({ ctx }) => {
    const { user, db } = await requireUser(ctx.req);
    const { data, error } = await db
      .from("payments")
      .select("*, courses(title, thumbnail, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  myCourses: publicQuery.query(async ({ ctx }) => {
    const { user, db } = await requireUser(ctx.req);
    const { data, error } = await db
      .from("purchased_courses")
      .select("*, courses(*)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("purchased_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  refund: publicQuery
    .input(z.object({ paymentId: z.number().int(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await requireAdmin(ctx.req);
      const db = getServiceDb();

      const { data: payment, error } = await db.from("payments").select("*").eq("id", input.paymentId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!payment) throw new Error("Payment not found");
      if (payment.status !== "captured") throw new Error("Only captured payments can be refunded");
      if (!payment.razorpay_payment_id) throw new Error("No Razorpay payment id on this record");

      const razorpay = getRazorpay();
      await razorpay.payments.refund(payment.razorpay_payment_id, {
        amount: toPaise(payment.final_amount),
        notes: { reason: input.reason ?? "Admin-initiated refund" },
      });

      await db
        .from("payments")
        .update({
          status: "refunded",
          refunded: true,
          refund_amount: payment.final_amount,
          refund_reason: input.reason ?? null,
        })
        .eq("id", payment.id);

      await db.from("purchased_courses").update({ status: "refunded" }).eq("user_id", payment.user_id).eq("course_id", payment.course_id);

      await bumpRevenueStats("refunded", payment.final_amount);
      return { success: true };
    }),
});

export async function unlockCourse(
  payment: {
    id: number; user_id: string; course_id: number; amount: number; final_amount: number;
    razorpay_order_id: string; coupon_code: string | null; discount_amount: number;
    currency: string; payment_method?: string | null; status: string;
  },
  razorpayPaymentId: string,
  razorpaySignature: string | null,
) {
  const db = getServiceDb();
  if (payment.status === "captured") return;

  await db
    .from("payments")
    .update({
      status: "captured",
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      webhook_received: razorpaySignature === null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id);

  const { data: existing, error: checkError } = await db
    .from("purchased_courses")
    .select("id")
    .eq("user_id", payment.user_id)
    .eq("course_id", payment.course_id)
    .maybeSingle();
  if (checkError) throw new Error(checkError.message);

  if (!existing) {
    const { error: insertError } = await db.from("purchased_courses").insert({
      user_id: payment.user_id,
      course_id: payment.course_id,
      payment_id: razorpayPaymentId,
      order_id: payment.razorpay_order_id,
      razorpay_signature: razorpaySignature,
      amount: payment.final_amount,
      payment_method: payment.payment_method ?? null,
      status: "completed",
      coupon_code: payment.coupon_code,
      discount_amount: payment.discount_amount,
      currency: payment.currency,
      unlocked_at: new Date().toISOString(),
    });
    if (insertError) throw new Error(insertError.message);
  }

  const { data: course } = await db
    .from("courses")
    .select("total_sales, total_revenue")
    .eq("id", payment.course_id)
    .maybeSingle();
  if (course) {
    await db
      .from("courses")
      .update({
        total_sales: (course.total_sales ?? 0) + 1,
        total_revenue: (course.total_revenue ?? 0) + payment.final_amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.course_id);
  }

  await bumpRevenueStats("captured", payment.final_amount);
}

export async function bumpRevenueStats(kind: "captured" | "failed" | "refunded", amount: number) {
  const db = getServiceDb();
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await db.from("revenue_stats").select("*").eq("date", today).maybeSingle();

  const delta = {
    total_orders: kind === "captured" ? 1 : 0,
    total_revenue: kind === "captured" ? amount : 0,
    successful_payments: kind === "captured" ? 1 : 0,
    refunded_payments: kind === "refunded" ? 1 : 0,
    failed_payments: kind === "failed" ? 1 : 0,
  };

  if (!existing) {
    await db.from("revenue_stats").insert({ date: today, ...delta });
    return;
  }

  await db
    .from("revenue_stats")
    .update({
      total_orders: existing.total_orders + delta.total_orders,
      total_revenue: existing.total_revenue + delta.total_revenue,
      successful_payments: existing.successful_payments + delta.successful_payments,
      refunded_payments: existing.refunded_payments + delta.refunded_payments,
      failed_payments: existing.failed_payments + delta.failed_payments,
    })
    .eq("date", today);
}