import { DemoClock } from '@/demo/demo-clock';
import type { TrackId } from '@/domain/track';

import { StubFeedbackHub } from './stub-feedback-hub';

const makeClock = () => new DemoClock(new Date(2026, 9, 15, 18, 42), () => 0);

test('accepts ratings and lists the newest first', async () => {
  const hub = new StubFeedbackHub(makeClock());
  const subject = { kind: 'track', trackId: 'track-1' as TrackId } as const;

  const initial = await hub.list();
  expect(initial.length).toBeGreaterThan(0);
  const first = await hub.submitRating({ subject, score: 3 });
  const second = await hub.submitRating({ subject, score: 5, comment: 'Gut' });

  expect(first.id).not.toBe(second.id);
  expect(second).toMatchObject({ subject, score: 5, comment: 'Gut', createdAt: expect.any(Date) });
  expect(await hub.list()).toEqual([second, first, ...initial]);
});

test('returns a separate list so callers cannot remove stored ratings', async () => {
  const hub = new StubFeedbackHub(makeClock());
  const initialCount = (await hub.list()).length;
  await hub.submitRating({ subject: { kind: 'track', trackId: 'track-1' as TrackId }, score: 4 });

  const ratings = await hub.list();
  ratings.pop();
  expect(await hub.list()).toHaveLength(initialCount + 1);
});

test('uses demo time and clears ratings when the clock jumps', async () => {
  let elapsed = 0;
  const start = new Date(2026, 9, 15, 18, 42);
  const clock = new DemoClock(start, () => elapsed);
  const hub = new StubFeedbackHub(clock);
  const input = { subject: { kind: 'track', trackId: 'track-1' as TrackId }, score: 4 } as const;

  const initial = await hub.list();
  const first = await hub.submitRating(input);
  expect(first.createdAt).toEqual(start);
  elapsed += 60_000;
  expect(await hub.list()).toEqual([first, ...initial]);

  const newTime = new Date(2026, 9, 15, 20, 42);
  clock.jumpTo(newTime);
  const afterJump = await hub.list();
  expect(afterJump.length).toBeGreaterThan(0);
  expect(afterJump).not.toContainEqual(first);
  expect(afterJump.every((rating) => rating.createdAt <= newTime)).toBe(true);
  expect(afterJump).toEqual(await new StubFeedbackHub(makeClockAt(newTime)).list());
  const second = await hub.submitRating(input);
  expect(second.createdAt).toEqual(newTime);
  expect(second.id).not.toBe(first.id);
  expect(await hub.list()).toEqual([second, ...afterJump]);
});

function makeClockAt(date: Date) {
  return new DemoClock(date, () => 0);
}
