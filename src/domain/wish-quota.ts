export const wishesPerHour = 3;

export type WishQuota = {
  limit: number;
  used: number;
  remaining: number;
  exhausted: boolean;
  resetsAt: Date;
};

function startOfHour(date: Date): Date {
  const start = new Date(date);
  start.setMinutes(0, 0, 0);
  return start;
}

/**
 * The quota fills up again at the full hour instead of 60 minutes after each wish, so listeners
 * see one fixed time ("zurückgesetzt 19:00") rather than a different one per wish.
 */
export function wishQuota(sentAt: readonly Date[], now: Date, limit = wishesPerHour): WishQuota {
  const from = startOfHour(now);
  const resetsAt = new Date(from.getTime() + 60 * 60_000);
  const used = sentAt.filter((at) => at >= from && at < resetsAt).length;
  const remaining = Math.max(limit - used, 0);
  return { limit, used, remaining, exhausted: remaining === 0, resetsAt };
}
