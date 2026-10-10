import type { Hono } from "hono";
import type { HttpBindings } from "@hono/node-server";
import crypto from "crypto";
import { getServiceDb } from "./queries/connection";
import { env } from "./lib/env";
import { unlockCourse, bumpRevenueStats } from "./payment-router";

type App = Hono<{ Bindings: HttpBindings }>;

export function registerWebhookRoute(app: App) {
  app.post("/api/webhooks/razorpay", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("x-razorpay-signature") ?? "";

    if (!env.razorpayWebhookSecret) {
      console.error("[razorpay webhook] RAZORPAY_WEBHOOK_SECRET not set — rejecting");
      return c.json({ error: "Webhook not configured" }, 500);
    }

    const expected = crypto.createHmac("sha256", env.razorpayWebhookSecret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    const valid = sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
    if (!valid) {
      console.error("[razorpay webhook] signature mismatch — rejecting");
      return c.json({ error: "Invalid signature" }, 400);
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }

    const db = getServiceDb(); // no user JWT exists on a webhook request
    const eventType = event.event as string;

    try {
      if (eventType === "payment.captured" || eventType === "order.paid") {
        const paymentEntity = event.payload?.payment?.entity;
        if (!paymentEntity) return c.json({ ok: true });
        const { data: payment } = await db
          .from("payments")
          .select("*")
          .eq("razorpay_order_id", paymentEntity.order_id)
          .maybeSingle();
        if (!payment) {
          console.error(`[razorpay webhook] no payment row for order ${paymentEntity.order_id}`);
          return c.json({ ok: true });
        }
        await unlockCourse(payment, paymentEntity.id, null);
      }

      if (eventType === "payment.failed") {
        const paymentEntity = event.payload?.payment?.entity;
        if (paymentEntity?.order_id) {
          const { data: payment } = await db
            .from("payments")
            .select("id, status")
            .eq("razorpay_order_id", paymentEntity.order_id)
            .maybeSingle();
          if (payment && payment.status !== "captured") {
            await db.from("payments").update({ status: "failed" }).eq("id", payment.id);
            await bumpRevenueStats("failed", 0);
          }
        }
      }

      if (eventType === "refund.processed") {
        const refundEntity = event.payload?.refund?.entity;
        if (refundEntity?.payment_id) {
          const { data: payment } = await db
            .from("payments")
            .select("*")
            .eq("razorpay_payment_id", refundEntity.payment_id)
            .maybeSingle();
          if (payment && payment.status !== "refunded") {
            await db
              .from("payments")
              .update({ status: "refunded", refunded: true, refund_amount: payment.final_amount })
              .eq("id", payment.id);
            await db
              .from("purchased_courses")
              .update({ status: "refunded" })
              .eq("user_id", payment.user_id)
              .eq("course_id", payment.course_id);
            await bumpRevenueStats("refunded", payment.final_amount);
          }
        }
      }
    } catch (err: any) {
      console.error("[razorpay webhook] handler error:", err.message);
      return c.json({ ok: true, warning: "processed with errors" });
    }

    return c.json({ ok: true });
  });
}
