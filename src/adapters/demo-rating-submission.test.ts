import AsyncStorage from '@react-native-async-storage/async-storage';

import { DemoClock } from '@/demo/demo-clock';
import type { Rating, RatingInput } from '@/domain/rating';
import type { TrackId } from '@/domain/track';

import { createDemoRatingSubmission } from './demo-rating-submission';
import { hasRatedOnDevice, rememberRatingOnDevice } from './rating-history';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const now = new Date(2026, 9, 29, 18, 30);
const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;
const rating = (input: RatingInput): Rating => ({
  ...input,
  id: 'rating-1' as Rating['id'],
  createdAt: now,
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('a clock jump clears demo history before the next submission', async () => {
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput) => rating(input));
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock);
  await rememberRatingOnDevice(track);
  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent', remembered: true });
  expect(await flow.submit(track, 4)).toEqual({ status: 'alreadyRated' });
  clock.jumpTo(now);
  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent', remembered: true });
  expect(await hasRatedOnDevice(track)).toBe(true);
  expect(send).toHaveBeenCalledTimes(2);
  flow.dispose();
});

test('a jump during sending clears the old local rating before another request', async () => {
  const clock = new DemoClock(now, () => 0);
  let finish!: (value: Rating) => void;
  let signal!: () => void;
  const started = new Promise<void>((resolve) => {
    signal = resolve;
  });
  const send = jest.fn(
    (input: RatingInput) =>
      new Promise<Rating>((resolve) => {
        finish = resolve;
        signal();
      }),
  );
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock);
  const first = flow.submit(track, 4);
  await started;
  clock.jumpTo(now);
  expect(await flow.submit(track, 4)).toEqual({ status: 'busy' });
  finish(rating({ subject: track, score: 4 }));
  expect(await first).toEqual({ status: 'demoChanged' });
  expect(await hasRatedOnDevice(track, 'demo')).toBe(false);
  flow.dispose();
});

test('a failed reset prevents sending until the reset succeeds', async () => {
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput) => rating(input));
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock);
  clock.jumpTo(now);
  jest.mocked(AsyncStorage.getAllKeys).mockRejectedValueOnce(new Error('storage'));
  await expect(flow.submit(track, 4)).rejects.toThrow('storage');
  expect(send).not.toHaveBeenCalled();
  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent', remembered: true });
  flow.dispose();
});

test('a jump while saving clears the old rating after the write finishes', async () => {
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput) => rating(input));
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock);
  const originalWrite = jest.mocked(AsyncStorage.setItem).getMockImplementation()!;
  let finish!: () => void;
  let signal!: () => void;
  const started = new Promise<void>((resolve) => {
    signal = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    finish = resolve;
  });
  jest.mocked(AsyncStorage.setItem).mockImplementationOnce(async (...args) => {
    signal();
    await waiting;
    return originalWrite(...args);
  });

  const first = flow.submit(track, 4);
  await started;
  clock.jumpTo(now);
  finish();
  expect(await first).toEqual({ status: 'demoChanged' });
  expect(await hasRatedOnDevice(track, 'demo')).toBe(false);
  flow.dispose();
});
