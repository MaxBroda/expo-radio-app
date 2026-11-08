import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ShowId } from '@/domain/show';
import type { TrackId } from '@/domain/track';

import {
  clearDemoRatingHistory,
  hasRatedOnDevice,
  ratedScoreOnDevice,
  rememberRatingOnDevice,
  trackScoresOnDevice,
} from './rating-history';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('remembers a rated track and keeps another track separate', async () => {
  const first = { kind: 'track', trackId: 'track-1' as TrackId } as const;
  const second = { kind: 'track', trackId: 'track-2' as TrackId } as const;

  expect(await hasRatedOnDevice(first)).toBe(false);
  await rememberRatingOnDevice(first, 4);
  expect(await hasRatedOnDevice(first)).toBe(true);
  expect(await hasRatedOnDevice(second)).toBe(false);
});

test('keeps shows separate from tracks and from other broadcasts', async () => {
  const show = { kind: 'show', showId: 'show-1' as ShowId } as const;
  const otherShow = { kind: 'show', showId: 'show-2' as ShowId } as const;
  const track = { kind: 'track', trackId: 'show-1' as TrackId } as const;

  await rememberRatingOnDevice(show, 4);
  expect(await hasRatedOnDevice(show)).toBe(true);
  expect(await hasRatedOnDevice(otherShow)).toBe(false);
  expect(await hasRatedOnDevice(track)).toBe(false);
});

test('reports a storage error instead of pretending the rating was remembered', async () => {
  const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('storage'));
  await expect(rememberRatingOnDevice(track, 4)).rejects.toThrow('storage');
});

test('clears demo ratings without removing device ratings or other data', async () => {
  const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;
  const show = { kind: 'show', showId: 'show-1' as ShowId } as const;
  await rememberRatingOnDevice(track, 4);
  await rememberRatingOnDevice(track, 4, 'demo');
  await rememberRatingOnDevice(show, 4, 'demo');
  await AsyncStorage.setItem('other:data', 'kept');

  await clearDemoRatingHistory();

  expect(await hasRatedOnDevice(track)).toBe(true);
  expect(await hasRatedOnDevice(track, 'demo')).toBe(false);
  expect(await hasRatedOnDevice(show, 'demo')).toBe(false);
  expect(await AsyncStorage.getItem('other:data')).toBe('kept');
});

test('remembers the score given', async () => {
  const track = { kind: 'track', trackId: 'track-1' as TrackId } as const;

  expect(await ratedScoreOnDevice(track)).toBeUndefined();
  await rememberRatingOnDevice(track, 2);
  expect(await ratedScoreOnDevice(track)).toBe(2);
});

test('lists the scores of rated tracks in one scope only', async () => {
  const first = { kind: 'track', trackId: 'track-1' as TrackId } as const;
  const second = { kind: 'track', trackId: 'track-2' as TrackId } as const;
  await rememberRatingOnDevice(first, 4, 'demo');
  await rememberRatingOnDevice(second, 2, 'demo');
  await rememberRatingOnDevice({ kind: 'track', trackId: 'track-3' as TrackId }, 5);
  await rememberRatingOnDevice({ kind: 'show', showId: 'show-1' as ShowId }, 3, 'demo');

  expect(await trackScoresOnDevice('demo')).toEqual(
    new Map([
      ['track-1', 4],
      ['track-2', 2],
    ]),
  );
});
