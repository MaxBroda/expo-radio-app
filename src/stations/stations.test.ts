import { DemoClock } from '@/demo/demo-clock';
import { defaultFlags } from '@/demo/demo-settings';
import type { ShowId } from '@/domain/show';
import type { TrackId } from '@/domain/track';

import { createStubStations } from './stations';

test('each call creates independent station instances', () => {
  const first = createStubStations();
  const second = createStubStations();
  expect(first.feedbackHub).not.toBe(second.feedbackHub);
  expect(first.wishSystem).not.toBe(second.wishSystem);
});

test('stubs follow the demo clock and the demo states', async () => {
  const stations = createStubStations({
    now: () => new Date(2026, 9, 15, 18, 42),
    flags: () => ({ ...defaultFlags, quotaExhausted: true }),
  });
  expect(await stations.wishSystem.quota()).toMatchObject({
    exhausted: true,
    resetsAt: new Date(2026, 9, 15, 19, 0),
  });
});

test('the feedback hub uses the supplied demo clock', async () => {
  const start = new Date(2026, 9, 15, 18, 42);
  const clock = new DemoClock(start, () => 0);
  const { feedbackHub } = createStubStations(undefined, clock);
  const input = { subject: { kind: 'track', trackId: 'track-1' as TrackId }, score: 4 } as const;
  expect((await feedbackHub.submitRating(input)).createdAt).toEqual(start);
  clock.jumpTo(new Date(2026, 9, 15, 20, 42));
  const next = await feedbackHub.submitRating(input);
  const ratings = await feedbackHub.list();
  expect(ratings[0]).toEqual(next);
  expect(ratings.filter((rating) => rating.id.startsWith('rating-'))).toEqual([next]);
  expect(next.createdAt).toEqual(clock.now());
});

test('a submitted rating is available through the station feedback hub', async () => {
  const stations = createStubStations();
  const trackRating = await stations.feedbackHub.submitRating({
    subject: { kind: 'track', trackId: 'track-1' as TrackId },
    score: 5,
    comment: 'Gut',
  });
  const showRating = await stations.feedbackHub.submitRating({
    subject: { kind: 'show', showId: 'show-1' as ShowId },
    score: 4,
  });

  const studioRatings = await stations.feedbackHub.list();
  expect(studioRatings).toContainEqual(trackRating);
  expect(studioRatings).toContainEqual(showRating);
});
