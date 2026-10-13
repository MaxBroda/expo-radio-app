import { NotImplementedError, StationUnavailableError } from './errors';

test('station unavailable keeps the station and the cause', () => {
  const cause = new Error('timeout');
  const error = new StationUnavailableError('Playout', { cause });

  expect(error).toBeInstanceOf(Error);
  expect(error.name).toBe('StationUnavailableError');
  expect(error.station).toBe('Playout');
  expect(error.cause).toBe(cause);
});

test('not implemented names the operation', () => {
  const error = new NotImplementedError('WishSystem.list');

  expect(error.name).toBe('NotImplementedError');
  expect(error.message).toContain('WishSystem.list');
});
