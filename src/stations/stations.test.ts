import { DemoClock } from '@/demo/demo-clock';
import { defaultFlags } from '@/demo/demo-settings';
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
  expect(await feedbackHub.list()).toEqual([next]);
  expect(next.createdAt).toEqual(clock.now());
});
