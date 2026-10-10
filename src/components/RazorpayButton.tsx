/**
 * src/components/RazorpayButton.tsx
 * Reusable "Buy Now" flow for a premium course: create order -> open
 * Razorpay checkout -> verify signature -> refresh purchased courses.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Tag, CheckCircle2, XCircle, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { loadRazorpay, openCheckout } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";

interface RazorpayButtonProps {
  courseId: number;
  courseTitle: string;
  basePrice: number;
  discountPrice?: number | null;
  currency?: string;
  onSuccess?: () => void;
  className?: string;
}

type Phase = "idle" | "loading" | "success" | "failed";

export default function RazorpayButton({
  courseId,
  courseTitle,
  basePrice,
  discountPrice,
  currency = "INR",
  onSuccess,
  className,
}: RazorpayButtonProps) {
  const { user, refreshPurchasedCourses } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<{ finalPrice: number; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createOrder = trpc.payment.createOrder.useMutation();
  const verifyPayment = trpc.payment.verifyPayment.useMutation();
  const applyCoupon = trpc.payment.applyCoupon.useMutation();

  const displayPrice = couponResult?.finalPrice ?? discountPrice ?? basePrice;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      const result = await applyCoupon.mutateAsync({ courseId, couponCode: couponCode.trim() });
      setCouponResult(result);
    } catch (err: any) {
      setCouponResult(null);
      setCouponError(err.message || "Invalid coupon");
    }
  };

  const handleBuy = async () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setPhase("loading");
    setErrorMsg(null);
    try {
      const scriptOk = await loadRazorpay();
      if (!scriptOk) throw new Error("Could not load Razorpay checkout — check your connection.");

      const order = await createOrder.mutateAsync({
        courseId,
        couponCode: couponResult ? couponCode.trim() : undefined,
      });

      const result = await openCheckout({
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        keyId: order.keyId,
        courseTitle: order.courseTitle,
        prefillEmail: user.email ?? undefined,
        prefillName: (user.user_metadata?.display_name as string) ?? undefined,
        onDismiss: () => setPhase("idle"),
      });

      await verifyPayment.mutateAsync(result);
      await refreshPurchasedCourses?.();
      setPhase("success");
      onSuccess?.();
    } catch (err: any) {
      if (err.message === "dismissed") {
        setPhase("idle");
        return;
      }
      setErrorMsg(err.message || "Payment failed. Please try again.");
      setPhase("failed");
    }
  };

  return (
    <div className={className}>
      <div className="flex items-baseline gap-2 mb-3">
        {discountPrice != null && discountPrice < basePrice && !couponResult && (
          <span className="text-sm line-through" style={{ color: "var(--text-muted)" }}>
            {currency} {basePrice.toFixed(0)}
          </span>
        )}
        <span className="text-2xl font-black" style={{ color: "var(--text)" }}>
          {currency} {displayPrice.toFixed(0)}
        </span>
        {couponResult && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#58CC0220", color: "#58CC02" }}>
            -{currency} {couponResult.discountAmount.toFixed(0)} applied
          </span>
        )}
      </div>

      {showCoupon ? (
        <div className="flex gap-2 mb-3">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="flex-1 px-3 py-2 rounded-xl text-sm border"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)", color: "var(--text)" }}
          />
          <button
            onClick={handleApplyCoupon}
            disabled={applyCoupon.isPending}
            className="px-3 py-2 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "var(--border)", color: "var(--text)" }}
          >
            {applyCoupon.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCoupon(true)}
          className="flex items-center gap-1.5 text-xs font-bold mb-3"
          style={{ color: "#6366f1" }}
        >
          <Tag className="w-3.5 h-3.5" /> Have a coupon?
        </button>
      )}
      {couponError && <p className="text-xs mb-3" style={{ color: "#ef4444" }}>{couponError}</p>}

      <button
        onClick={handleBuy}
        disabled={phase === "loading"}
        className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-white text-sm transition-transform active:scale-95"
        style={{ backgroundColor: "#6366f1", boxShadow: "0 4px 0 #4f46e5", opacity: phase === "loading" ? 0.7 : 1 }}
      >
        {phase === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {phase === "loading" ? "Processing..." : `Buy Now · ${currency} ${displayPrice.toFixed(0)}`}
      </button>

      <AnimatePresence>
        {phase === "success" && (
          <SuccessOverlay courseTitle={courseTitle} onClose={() => setPhase("idle")} />
        )}
        {phase === "failed" && (
          <FailedOverlay message={errorMsg} onClose={() => setPhase("idle")} onRetry={handleBuy} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessOverlay({ courseTitle, onClose }: { courseTitle: string; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="d-card max-w-sm w-full p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3">
          <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        </button>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: "#58CC0220" }}
        >
          <CheckCircle2 className="w-9 h-9" style={{ color: "#58CC02" }} />
        </motion.div>
        <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
          You're in! 🎉
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          {courseTitle} is unlocked — lifetime access, let's go.
        </p>
        <button
          onClick={onClose}
          className="w-full px-5 py-3 rounded-2xl font-bold text-white text-sm"
          style={{ backgroundColor: "#58CC02" }}
        >
          Start Learning
        </button>
      </motion.div>
    </motion.div>
  );
}

function FailedOverlay({
  message,
  onClose,
  onRetry,
}: {
  message: string | null;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="d-card max-w-sm w-full p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3">
          <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        </button>
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: "#ef444420" }}
        >
          <XCircle className="w-9 h-9" style={{ color: "#ef4444" }} />
        </div>
        <h3 className="font-display text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
          Payment didn't go through
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{message}</p>
        <button
          onClick={onRetry}
          className="w-full px-5 py-3 rounded-2xl font-bold text-white text-sm"
          style={{ backgroundColor: "#6366f1" }}
        >
          Try Again
        </button>
      </motion.div>
    </motion.div>
  );
}
