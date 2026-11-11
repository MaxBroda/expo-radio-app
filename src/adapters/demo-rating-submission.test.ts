import AsyncStorage from '@react-native-async-storage/async-storage';

import { DemoClock } from '@/demo/demo-clock';
import { DemoSettings } from '@/demo/demo-settings';
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
  await rememberRatingOnDevice(track, 4);
  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent', remembered: true });
  expect(await flow.submit(track, 4)).toEqual({ status: 'alreadyRated' });
  clock.jumpTo(now);
  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent', remembered: true });
  expect(await hasRatedOnDevice(track)).toBe(true);
  expect(send).toHaveBeenCalledTimes(2);
  flow.dispose();
});

test('a new demo session can clear old demo history without deleting device history', async () => {
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput) => rating(input));
  await rememberRatingOnDevice(track, 4);
  await rememberRatingOnDevice(track, 4, 'demo');
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock, {
    resetOnStart: true,
  });

  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent', remembered: true });
  expect(await hasRatedOnDevice(track)).toBe(true);
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

test('a jump while checking history does not send the old rating', async () => {
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput) => rating(input));
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock);
  const originalRead = jest.mocked(AsyncStorage.getItem).getMockImplementation()!;
  let finish!: () => void;
  let signal!: () => void;
  const started = new Promise<void>((resolve) => {
    signal = resolve;
  });
  const waiting = new Promise<void>((resolve) => {
    finish = resolve;
  });
  jest.mocked(AsyncStorage.getItem).mockImplementationOnce(async (...args) => {
    signal();
    await waiting;
    return originalRead(...args);
  });

  const attempt = flow.submit(track, 4);
  await started;
  clock.jumpTo(now);
  finish();
  expect(await attempt).toEqual({ status: 'demoChanged' });
  expect(send).not.toHaveBeenCalled();
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

test('reads back the score of a sent rating until the demo clock jumps', async () => {
  const clock = new DemoClock(now, () => 0);
  const send = jest.fn(async (input: RatingInput) => rating(input));
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock);

  await flow.submit(track, 2);
  expect(await flow.ratedScore(track)).toBe(2);
  expect(await flow.trackScores()).toEqual(new Map([['track-1', 2]]));

  clock.jumpTo(now);
  expect(await flow.ratedScore(track)).toBeUndefined();
  expect(await flow.trackScores()).toEqual(new Map());
  flow.dispose();
});

test('writes the seeded ratings on start and again after a clock jump', async () => {
  const clock = new DemoClock(now, () => 0);
  const seeded = { kind: 'track', trackId: 'track-9' as TrackId } as const;
  const flow = createDemoRatingSubmission({ submitRating: jest.fn(), list: jest.fn() }, clock, {
    resetOnStart: true,
    seed: () => [{ subject: seeded, score: 2 }],
  });

  expect(await flow.ratedScore(seeded)).toBe(2);
  expect(await flow.submit(seeded, 5)).toEqual({ status: 'alreadyRated' });

  clock.jumpTo(now);
  expect(await flow.trackScores()).toEqual(new Map([['track-9', 2]]));
  flow.dispose();
});

test('keeps ratings per listener and seeds only the first after a clock jump', async () => {
  const clock = new DemoClock(now, () => 0);
  const settings = new DemoSettings();
  const seeded = { kind: 'track', trackId: 'track-9' as TrackId } as const;
  const send = jest.fn(async (input: RatingInput) => rating(input));
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock, {
    resetOnStart: true,
    listener: () => settings.get().listener,
    seed: () => [{ subject: seeded, score: 2 }],
  });

  expect(await flow.ratedScore(seeded)).toBe(2);
  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent' });
  settings.set({ listener: 2 });
  expect(await flow.ratedScore(seeded)).toBeUndefined();
  expect(await flow.ratedScore(track)).toBeUndefined();
  expect(await flow.submit(track, 3)).toMatchObject({ status: 'sent' });
  settings.set({ listener: 1 });
  expect(await flow.ratedScore(track)).toBe(4);
  clock.jumpTo(now);
  expect(await flow.ratedScore(track)).toBeUndefined();
  expect(await flow.ratedScore(seeded)).toBe(2);
  settings.set({ listener: 2 });
  expect(await flow.ratedScore(track)).toBeUndefined();
  expect(await flow.ratedScore(seeded)).toBeUndefined();
  expect(send).toHaveBeenCalledTimes(2);
  flow.dispose();
});

test('a listener change while sending keeps the rating with its original listener', async () => {
  const clock = new DemoClock(now, () => 0);
  const settings = new DemoSettings();
  let finish!: (value: Rating) => void;
  let signal!: () => void;
  const started = new Promise<void>((resolve) => (signal = resolve));
  const send = jest.fn(
    () =>
      new Promise<Rating>((resolve) => {
        finish = resolve;
        signal();
      }),
  );
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock, {
    listener: () => settings.get().listener,
  });

  const pending = flow.submit(track, 4);
  await started;
  settings.set({ listener: 2 });
  finish(rating({ subject: track, score: 4 }));
  expect(await pending).toEqual({ status: 'demoChanged' });
  expect(await flow.ratedScore(track)).toBeUndefined();
  settings.set({ listener: 1 });
  expect(await flow.ratedScore(track)).toBe(4);
  flow.dispose();
});

test('a failed local save can be retried only for the listener who sent the rating', async () => {
  const clock = new DemoClock(now, () => 0);
  const settings = new DemoSettings();
  const send = jest.fn(async (input: RatingInput) => rating(input));
  const flow = createDemoRatingSubmission({ submitRating: send, list: jest.fn() }, clock, {
    listener: () => settings.get().listener,
  });
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage'));

  expect(await flow.submit(track, 4)).toMatchObject({ status: 'sent', remembered: false });
  settings.set({ listener: 2 });
  expect(await flow.retryLocalSave()).toBe(false);
  expect(await flow.ratedScore(track)).toBeUndefined();
  settings.set({ listener: 1 });
  expect(await flow.retryLocalSave()).toBe(true);
  expect(await flow.ratedScore(track)).toBe(4);
  expect(send).toHaveBeenCalledTimes(1);
  flow.dispose();
});
