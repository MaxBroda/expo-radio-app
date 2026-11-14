import type { Rating } from './rating';

const fifteenMinutes = 15 * 60 * 1000;

export function average(ratings: Rating[]) {
  if (ratings.length === 0) return undefined;
  const sum = ratings.reduce((total, rating) => total + rating.score, 0);
  return sum / ratings.length;
}

function ratingsBetween(ratings: Rating[], from: Date, to: Date) {
  return ratings.filter((rating) => rating.createdAt > from && rating.createdAt <= to);
}

export function calculateMood(ratings: Rating[], now: Date) {
  const from = new Date(now.getTime() - fifteenMinutes);
  const before = new Date(from.getTime() - fifteenMinutes);

  const recent = ratingsBetween(ratings, from, now);
  recent.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const previous = ratingsBetween(ratings, before, from);

  const recentAverage = average(recent);
  const previousAverage = average(previous);
  const trend =
    recentAverage !== undefined && previousAverage !== undefined
      ? recentAverage - previousAverage
      : undefined;

  return { from, to: now, recent, average: recentAverage, trend };
}
