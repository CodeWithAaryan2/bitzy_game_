/**
 * src/lib/razorpay.ts
 * Thin wrapper around the Razorpay Checkout script + the payment tRPC
 * procedures. RazorpayButton.tsx is the only consumer that should need
 * to reach for this directly.
 */
import { trpc } from "@/providers/trpc";

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptPromise: Promise<boolean> | null = null;

/** Loads the Razorpay checkout.js script once, reused across calls. */
export function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => {
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export interface RazorpaySuccessResult {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Opens the Razorpay checkout popup for an already-created order.
 * Resolves with the raw checkout response on success, rejects (or the
 * promise never settles) if the user dismisses the popup — callers
 * should treat a dismiss as "payment pending", not "payment failed".
 */
export function openCheckout(opts: {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  courseTitle: string;
  prefillEmail?: string;
  prefillName?: string;
  onDismiss?: () => void;
}): Promise<RazorpaySuccessResult> {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: opts.currency,
      name: "Bitzy",
      description: opts.courseTitle,
      theme: { color: "#6366f1" },
      prefill: {
        email: opts.prefillEmail,
        name: opts.prefillName,
      },
      handler: (response: RazorpaySuccessResult) => resolve(response),
      modal: {
        ondismiss: () => {
          opts.onDismiss?.();
          reject(new Error("dismissed"));
        },
      },
    });
    rzp.on("payment.failed", (response: any) => {
      reject(new Error(response?.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}

// Re-exported hooks for convenience — components can also call
// trpc.payment.* directly, these just save an import elsewhere.
export const usePaymentTrpc = () => trpc.payment;
