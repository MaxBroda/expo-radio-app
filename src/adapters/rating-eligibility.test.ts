import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TrackId } from '@/domain/track';
import { schedule } from '@/seed/schedule';

import { checkRatingEligibility } from './rating-eligibility';
import { rememberRatingOnDevice } from './rating-history';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('a track can be rated until this device has rated it', async () => {
  const target = { kind: 'track', trackId: 'track-1' as TrackId } as const;
  const now = new Date(2026, 9, 29, 18, 30);
  expect(await checkRatingEligibility(target, now)).toBe('allowed');
  await rememberRatingOnDevice(target);
  expect(await checkRatingEligibility(target, now)).toBe('alreadyRated');
});

test('a show must be on air and not yet rated on this device', async () => {
  const now = new Date(2026, 9, 29, 18, 30);
  const show = schedule.showAt(now);
  const target = { kind: 'show', show } as const;
  expect(await checkRatingEligibility(target, now)).toBe('allowed');
  await rememberRatingOnDevice({ kind: 'show', showId: show.id });
  expect(await checkRatingEligibility(target, now)).toBe('alreadyRated');
  expect(await checkRatingEligibility(target, show.endsAt)).toBe('windowClosed');
});

test('a storage read failure is reported to the caller', async () => {
  const read = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('storage'));
  try {
    await expect(
      checkRatingEligibility({ kind: 'track', trackId: 'track-1' as TrackId }, new Date()),
    ).rejects.toThrow('storage');
  } finally {
    read.mockRestore();
  }
});

test('an unmoderated show cannot be rated as a host', async () => {
  const now = new Date(2026, 9, 29, 23, 30);
  expect(await checkRatingEligibility({ kind: 'show', show: schedule.showAt(now) }, now)).toBe(
    'unmoderated',
  );
});
