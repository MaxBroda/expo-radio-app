import type { Show } from './show';
import type { RatingSubject } from './rating';

export function isShowRatingOpen(show: Show, now: Date): boolean {
  return now >= show.startsAt && now < show.endsAt;
}

/** The previous subjects belong to the same device. */
export function hasRated(subject: RatingSubject, previous: readonly RatingSubject[]): boolean {
  return previous.some((item) => {
    if (subject.kind === 'track' && item.kind === 'track') return subject.trackId === item.trackId;
    if (subject.kind === 'show' && item.kind === 'show') return subject.showId === item.showId;
    return false;
  });
}
