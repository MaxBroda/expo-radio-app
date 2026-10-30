import AsyncStorage from '@react-native-async-storage/async-storage';

import { DemoClock } from '@/demo/demo-clock';
import type { Rating, RatingInput } from '@/domain/rating';
import type { TrackId } from '@/domain/track';
import type { FeedbackHub } from '@/ports/feedback-hub';
import { schedule } from '@/seed/schedule';

import { rememberRatingOnDevice } from './rating-history';
import { createRatingSubmission } from './rating-submission';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const now = new Date(2026, 9, 29, 18, 30);
const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;
const makeRating = (input: RatingInput): Rating => ({
  ...input,
  id: 'rating-1' as Rating['id'],
  createdAt: now,
});

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('sends a permitted rating and blocks another after remembering it', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const feedbackHub: FeedbackHub = { submitRating: send, list: jest.fn() };
  const flow = createRatingSubmission(feedbackHub);
  expect(await flow.submit(track, 4, 'Gut', () => now)).toMatchObject({
    status: 'sent',
    remembered: true,
  });
  expect(send).toHaveBeenCalledWith({ subject: track, score: 4, comment: 'Gut' });
  expect(await flow.submit(track, 4, 'Gut', () => now)).toEqual({ status: 'alreadyRated' });
  expect(send).toHaveBeenCalledTimes(1);
});

test('a new submission flow reads the saved rating', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const feedbackHub: FeedbackHub = { submitRating: send, list: jest.fn() };
  const firstFlow = createRatingSubmission(feedbackHub);
  expect(await firstFlow.submit(track, 4, undefined, () => now)).toMatchObject({
    status: 'sent',
    remembered: true,
  });

  const newFlow = createRatingSubmission(feedbackHub);
  expect(await newFlow.submit(track, 4, undefined, () => now)).toEqual({
    status: 'alreadyRated',
  });
  expect(send).toHaveBeenCalledTimes(1);
});

test('does not send an already rated track or a show outside its window', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  await rememberRatingOnDevice(track);
  expect(await flow.submit(track, 3, undefined, () => now)).toEqual({ status: 'alreadyRated' });
  const show = schedule.showAt(now);
  expect(await flow.submit({ kind: 'show', show }, 3, undefined, () => show.endsAt)).toEqual({
    status: 'windowClosed',
  });
  expect(send).not.toHaveBeenCalled();
});

test('checks the show window again after reading local history', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  const show = schedule.showAt(now);
  const clock = jest.fn().mockReturnValueOnce(now).mockReturnValueOnce(show.endsAt);
  expect(await flow.submit({ kind: 'show', show }, 3, undefined, clock)).toEqual({
    status: 'windowClosed',
  });
  expect(send).not.toHaveBeenCalled();
});

test('uses the current demo time when submitting a show rating', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  const show = schedule.showAt(now);
  const clock = new DemoClock(show.endsAt, () => 0);

  expect(await flow.submit({ kind: 'show', show }, 3, undefined, () => clock.now())).toEqual({
    status: 'windowClosed',
  });
  expect(send).not.toHaveBeenCalled();

  clock.jumpTo(now);
  expect(await flow.submit({ kind: 'show', show }, 3, undefined, () => clock.now())).toMatchObject({
    status: 'sent',
    remembered: true,
  });
  expect(send).toHaveBeenCalledTimes(1);
});

test('sends an eligible show using its broadcast id', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  const show = schedule.showAt(now);
  expect(await flow.submit({ kind: 'show', show }, 5, undefined, () => now)).toMatchObject({
    status: 'sent',
    remembered: true,
  });
  expect(send).toHaveBeenCalledWith({
    subject: { kind: 'show', showId: show.id },
    score: 5,
    comment: undefined,
  });
});

test('does not send if local history cannot be read', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('storage'));
  await expect(flow.submit(track, 4, undefined, () => now)).rejects.toThrow('storage');
  expect(send).not.toHaveBeenCalled();
});

test('retries only local storage after the hub has accepted a rating', async () => {
  const send = jest.fn(async (input: RatingInput) => makeRating(input));
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  jest
    .mocked(AsyncStorage.setItem)
    .mockRejectedValueOnce(new Error('storage'))
    .mockRejectedValueOnce(new Error('storage'));
  expect(await flow.submit(track, 4, undefined, () => now)).toMatchObject({
    status: 'sent',
    remembered: false,
  });
  expect(await flow.submit(track, 4, undefined, () => now)).toEqual({
    status: 'awaitingLocalSave',
  });
  expect(send).toHaveBeenCalledTimes(1);
  expect(await flow.retryLocalSave()).toBe(false);
  expect(await flow.submit(track, 4, undefined, () => now)).toEqual({
    status: 'awaitingLocalSave',
  });
  expect(await flow.retryLocalSave()).toBe(true);
  expect(await flow.submit(track, 4, undefined, () => now)).toEqual({ status: 'alreadyRated' });
  expect(send).toHaveBeenCalledTimes(1);
});

test('does not issue a second request while the first is pending', async () => {
  let finish!: (rating: Rating) => void;
  let signalStarted!: () => void;
  const started = new Promise<void>((resolve) => {
    signalStarted = resolve;
  });
  const send = jest.fn(
    (input: RatingInput) =>
      new Promise<Rating>((resolve) => {
        finish = resolve;
        signalStarted();
      }),
  );
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  const first = flow.submit(track, 4, undefined, () => now);
  expect(await flow.submit(track, 4, undefined, () => now)).toEqual({ status: 'busy' });
  await started;
  finish(makeRating({ subject: track, score: 4 }));
  expect(await first).toMatchObject({ status: 'sent', remembered: true });
  expect(send).toHaveBeenCalledTimes(1);
});

test('propagates a rejected submission without marking the track rated', async () => {
  const send = jest
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(async (input: RatingInput) => makeRating(input));
  const flow = createRatingSubmission({ submitRating: send, list: jest.fn() });
  await expect(flow.submit(track, 4, undefined, () => now)).rejects.toThrow('offline');
  expect(await flow.submit(track, 4, undefined, () => now)).toMatchObject({
    status: 'sent',
    remembered: true,
  });
  expect(send).toHaveBeenCalledTimes(2);
});
