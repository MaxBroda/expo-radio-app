import { DemoClock } from '@/demo/demo-clock';
import { defaultFlags, DemoSettings } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
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
  expect((await stations.playout.getNowPlaying()).show.title).toBe('Feierabendwelle');
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
  expect(ratings).toContainEqual(next);
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

test('the demo send failure does not save a rating and allows retry', async () => {
  const clock = new DemoClock(new Date(2026, 9, 15, 18, 42), () => 0);
  const settings = new DemoSettings();
  const { feedbackHub } = createStubStations(
    { now: () => clock.now(), flags: () => settings.get() },
    clock,
  );
  const input = { subject: { kind: 'track', trackId: 'track-1' as TrackId }, score: 4 } as const;
  const before = await feedbackHub.list();

  settings.set({ sendFails: true });
  await expect(feedbackHub.submitRating(input)).rejects.toBeInstanceOf(StationUnavailableError);
  expect(await feedbackHub.list()).toEqual(before);

  settings.set({ sendFails: false });
  const rating = await feedbackHub.submitRating(input);
  expect(await feedbackHub.list()).toContainEqual(rating);
});
