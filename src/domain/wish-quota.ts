export const wishesPerHour = 3;

export type WishQuota = {
  limit: number;
  used: number;
  remaining: number;
  exhausted: boolean;
  resetsAt: Date;
};

const hourInMilliseconds = 60 * 60_000;

function currentHour(now: Date): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(now);
  startsAt.setMinutes(0, 0, 0);

  return {
    startsAt,
    endsAt: new Date(startsAt.getTime() + hourInMilliseconds),
  };
}

export function wishQuota(
  sentAt: readonly Date[],
  now: Date,
  limit: number = wishesPerHour,
): WishQuota {
  const { startsAt, endsAt } = currentHour(now);
  let used = 0;
  for (const timestamp of sentAt) {
    if (timestamp >= startsAt && timestamp < endsAt) {
      used += 1;
    }
  }

  const remaining = Math.max(0, limit - used);

  return {
    limit,
    used,
    remaining,
    exhausted: remaining === 0,
    resetsAt: endsAt,
  };
}
