import type { RatingSubject } from '@/domain/rating';
import { isShowRatingOpen } from '@/domain/rating-validation';
import type { Show } from '@/domain/show';
import type { TrackId } from '@/domain/track';

import { hasRatedOnDevice } from './rating-history';

export type RatingTarget = { kind: 'track'; trackId: TrackId } | { kind: 'show'; show: Show };
export type RatingEligibility = 'allowed' | 'alreadyRated' | 'windowClosed' | 'unmoderated';

export async function checkRatingEligibility(
  target: RatingTarget,
  now: Date,
): Promise<RatingEligibility> {
  if (target.kind === 'show' && !target.show.hostName) return 'unmoderated';
  if (target.kind === 'show' && !isShowRatingOpen(target.show, now)) return 'windowClosed';

  const subject: RatingSubject =
    target.kind === 'track'
      ? { kind: 'track', trackId: target.trackId }
      : { kind: 'show', showId: target.show.id };
  return (await hasRatedOnDevice(subject)) ? 'alreadyRated' : 'allowed';
}
