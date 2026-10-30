import { schedule } from '@/seed/schedule';
import type { ShowId } from './show';
import type { TrackId } from './track';

import { hasRated, isShowRatingOpen } from './rating-validation';

test('a show can be rated from the start until just before the end', () => {
  const show = schedule.showAt(new Date(2026, 9, 28, 18, 30));

  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 17, 59, 59))).toBe(false);
  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 18, 0))).toBe(true);
  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 19, 59, 59))).toBe(true);
  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 20, 0))).toBe(false);
});

test('a show crossing midnight uses the actual dates', () => {
  const show = schedule.showAt(new Date(2026, 9, 28, 23, 30));

  expect(isShowRatingOpen(show, new Date(2026, 9, 29, 0, 30))).toBe(true);
  expect(isShowRatingOpen(show, new Date(2026, 9, 29, 6, 0))).toBe(false);
});

test('recognizes a track already rated by this device', () => {
  const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;
  expect(hasRated(track, [])).toBe(false);
  expect(hasRated(track, [{ kind: 'track', trackId: 'track-2' as TrackId }])).toBe(false);
  expect(hasRated(track, [track])).toBe(true);
});

test('recognizes the same show but not another broadcast or a track with the same id', () => {
  const show = { kind: 'show', showId: 'morgen-2026-10-28' as ShowId } as const;
  expect(hasRated(show, [{ kind: 'show', showId: 'morgen-2026-10-29' as ShowId }])).toBe(false);
  expect(hasRated(show, [{ kind: 'track', trackId: 'morgen-2026-10-28' as TrackId }])).toBe(false);
  expect(hasRated(show, [show])).toBe(true);
});
