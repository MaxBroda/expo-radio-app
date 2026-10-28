import type { Show } from './show';

export function isShowRatingOpen(show: Show, now: Date): boolean {
  return now >= show.startsAt && now < show.endsAt;
}
