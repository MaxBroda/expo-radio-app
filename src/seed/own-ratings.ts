import type { RatingSubject, Score } from '@/domain/rating';

import type { Rotation } from './rotation';

export type OwnRating = { subject: RatingSubject; score: Score };

/** Positions in the history, newest first, as in design 04: the last track liked, one disliked. */
const rated: { index: number; score: Score }[] = [
  { index: 0, score: 4 },
  { index: 4, score: 2 },
];

/** Ratings this device already gave earlier in the demo, so the history shows badges on start. */
export function ownDemoRatings(rotation: Rotation, now: Date): OwnRating[] {
  const history = rotation.history(now, rated.at(-1)!.index + 1);
  return rated.flatMap(({ index, score }) => {
    const played = history[index];
    return played ? [{ subject: { kind: 'track', trackId: played.track.id }, score }] : [];
  });
}
