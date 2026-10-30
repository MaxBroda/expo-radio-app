import type { TrackId } from '@/domain/track';

import { StubFeedbackHub } from './stub-feedback-hub';

test('accepts ratings and lists the newest first', async () => {
  const hub = new StubFeedbackHub();
  const subject = { kind: 'track', trackId: 'track-1' as TrackId } as const;

  expect(await hub.list()).toEqual([]);
  const first = await hub.submitRating({ subject, score: 3 });
  const second = await hub.submitRating({ subject, score: 5, comment: 'Gut' });

  expect(first.id).not.toBe(second.id);
  expect(second).toMatchObject({ subject, score: 5, comment: 'Gut', createdAt: expect.any(Date) });
  expect(await hub.list()).toEqual([second, first]);
});

test('returns a separate list so callers cannot remove stored ratings', async () => {
  const hub = new StubFeedbackHub();
  await hub.submitRating({ subject: { kind: 'track', trackId: 'track-1' as TrackId }, score: 4 });

  const ratings = await hub.list();
  ratings.pop();
  expect(await hub.list()).toHaveLength(1);
});
