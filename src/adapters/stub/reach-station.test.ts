import type { Connection } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';

import { reachStation } from './reach-station';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('answers after the delay while online', async () => {
  const answered = jest.fn();

  reachStation('Playout', 300, () => 'online').then(answered);
  await jest.advanceTimersByTimeAsync(299);
  expect(answered).not.toHaveBeenCalled();
  await jest.advanceTimersByTimeAsync(1);
  expect(answered).toHaveBeenCalled();
});

test('fails while offline', async () => {
  await expect(reachStation('WishSystem', 0, () => 'offline')).rejects.toEqual(
    new StationUnavailableError('WishSystem'),
  );
});

test('holds the answer while loading is forced and delivers once it is switched off', async () => {
  let connection: Connection = 'loading';
  const answered = jest.fn();

  reachStation('MusicDatabase', 0, () => connection).then(answered);
  await jest.advanceTimersByTimeAsync(5000);
  expect(answered).not.toHaveBeenCalled();

  connection = 'online';
  await jest.advanceTimersByTimeAsync(500);
  expect(answered).toHaveBeenCalled();
});

test('fails if the connection drops while loading', async () => {
  let connection: Connection = 'loading';
  const result = reachStation('Playout', 0, () => connection);
  const failed = expect(result).rejects.toBeInstanceOf(StationUnavailableError);

  connection = 'offline';
  await jest.advanceTimersByTimeAsync(500);
  await failed;
});
