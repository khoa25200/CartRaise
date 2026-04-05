export type CartProgressResult = {
  progress: number;
  remaining: number;
  message: string;
};

export function calculateCartProgress(
  cartTotal: number,
  threshold: number
): CartProgressResult {
  const safeTotal = Number.isFinite(cartTotal) ? Math.max(0, cartTotal) : 0;
  const safeThreshold =
    Number.isFinite(threshold) && threshold > 0 ? threshold : 0;

  if (safeThreshold <= 0) {
    return {
      progress: 0,
      remaining: 0,
      message: "Campaign threshold is not configured.",
    };
  }

  const ratio = safeTotal / safeThreshold;
  const progress = Math.min(100, Math.round(ratio * 100));
  const remaining = Math.max(0, safeThreshold - safeTotal);

  const message =
    safeTotal >= safeThreshold
      ? "You unlocked your free gift!"
      : `Add $${remaining.toFixed(2)} more to unlock your free gift.`;

  return { progress, remaining, message };
}
