import { defaultFlags, type DemoFlags } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { TrackId } from '@/domain/track';
import type { Wish, WishId } from '@/domain/wish';
import { WishRejectedError } from '@/domain/wish-validation';

import { StubWishSystem } from './stub-wish-system';

const track = (id: string) => ({ kind: 'catalog', trackId: id as TrackId }) as const;

function setup(options: { wishes?: Wish[]; flags?: Partial<DemoFlags> } = {}) {
  let now = new Date(2026, 9, 15, 18, 42);
  let flags: DemoFlags = { ...defaultFlags, ...options.flags };
  const system = new StubWishSystem({
    now: () => now,
    wishes: options.wishes,
    delayMs: 0,
    flags: () => flags,
  });
  return {
    system,
    advance: (minutes: number) => (now = new Date(now.getTime() + minutes * 60_000)),
    setFlags: (patch: Partial<DemoFlags>) => (flags = { ...flags, ...patch }),
  };
}

test('starts with the seeded wishes, newest first', async () => {
  const wishes = await setup().system.list();

  expect(wishes).toHaveLength(10);
  expect(wishes[0].createdAt.getTime()).toBeGreaterThan(wishes[1].createdAt.getTime());
});

test('a new wish is open with one vote and readable by the studio', async () => {
  const { system } = setup({ wishes: [] });

  const wish = await system.submitRequest({ song: track('t_0038'), greeting: 'Hallo' });

  expect(wish).toMatchObject({
    song: track('t_0038'),
    greeting: 'Hallo',
    votes: 1,
    status: 'open',
  });
  expect(await system.list()).toEqual([wish]);
});

test('input is normalized before it is stored', async () => {
  const { system } = setup({ wishes: [] });

  const wish = await system.submitRequest({
    song: { kind: 'freeText', description: '  das Lied  mit dem Pfeifen ' },
    greeting: '   ',
  });

  expect(wish.song).toEqual({ kind: 'freeText', description: 'das Lied mit dem Pfeifen' });
  expect(wish.greeting).toBeUndefined();
});

const otherListener = (trackId: string): Wish => ({
  id: 'w_01' as WishId,
  song: track(trackId),
  createdAt: new Date(2026, 9, 15, 18, 0),
  votes: 4,
  status: 'open',
});

test('requesting a song another listener wished for adds a vote instead of a second entry', async () => {
  const { system } = setup({ wishes: [otherListener('t_0038')] });

  const wish = await system.submitRequest({ song: track('t_0038'), greeting: 'Noch mal' });

  expect(wish.id).toBe('w_01');
  expect(wish.votes).toBe(5);
  expect(wish.greeting).toBe('Noch mal');
  expect(await system.list()).toHaveLength(1);
});

test('a device can support an open song only once', async () => {
  const { system } = setup({ wishes: [otherListener('t_0038')] });
  await system.submitRequest({ song: track('t_0038') });

  await expect(system.submitRequest({ song: track('t_0038') })).rejects.toEqual(
    new WishRejectedError('alreadyRequested'),
  );
  expect((await system.list())[0].votes).toBe(5);
  expect((await system.quota()).remaining).toBe(2);
});

test('a device cannot vote for its own wish', async () => {
  const { system } = setup({ wishes: [] });
  await system.submitRequest({ song: track('t_0038') });

  await expect(system.submitRequest({ song: track('t_0038') })).rejects.toEqual(
    new WishRejectedError('alreadyRequested'),
  );
  expect(await system.list()).toHaveLength(1);
});

test('the same free text from one device is rejected regardless of case', async () => {
  const { system } = setup({ wishes: [] });
  await system.submitRequest({ song: { kind: 'freeText', description: 'Pfeifen am Anfang' } });

  await expect(
    system.submitRequest({ song: { kind: 'freeText', description: 'pfeifen  am anfang' } }),
  ).rejects.toEqual(new WishRejectedError('alreadyRequested'));
  expect(await system.list()).toHaveLength(1);
});

test('a song that was already decided can be requested again', async () => {
  const { system } = setup({ wishes: [] });
  const first = await system.submitRequest({ song: track('t_0038') });
  await system.setStatus(first.id, 'rejected');

  const again = await system.submitRequest({ song: track('t_0038') });

  expect(again.id).not.toBe(first.id);
  expect(await system.list()).toHaveLength(2);
});

test('invalid input is rejected by the system as well', async () => {
  const { system } = setup();

  await expect(
    system.submitRequest({ song: { kind: 'freeText', description: 'ab' } }),
  ).rejects.toEqual(new WishRejectedError('freeTextTooShort'));
});

test('the fourth wish in an hour is rejected until the full hour', async () => {
  const { system, advance } = setup({ wishes: [] });
  for (const id of ['t_0001', 't_0002', 't_0003']) await system.submitRequest({ song: track(id) });

  expect(await system.quota()).toMatchObject({ remaining: 0, exhausted: true });
  await expect(system.submitRequest({ song: track('t_0004') })).rejects.toEqual(
    new WishRejectedError('quotaExhausted'),
  );

  advance(18);

  expect(await system.quota()).toMatchObject({ remaining: 3, exhausted: false });
  await expect(system.submitRequest({ song: track('t_0004') })).resolves.toBeTruthy();
});

test('the demo state exhausts the quota without any wish sent', async () => {
  const { system } = setup({ flags: { quotaExhausted: true } });

  expect(await system.quota()).toMatchObject({ used: 3, remaining: 0, exhausted: true });
  await expect(system.submitRequest({ song: track('t_0001') })).rejects.toEqual(
    new WishRejectedError('quotaExhausted'),
  );
});

test('failed sending keeps the list and the quota unchanged', async () => {
  const { system, setFlags } = setup({ wishes: [], flags: { sendFails: true } });

  await expect(system.submitRequest({ song: track('t_0001') })).rejects.toBeInstanceOf(
    StationUnavailableError,
  );

  setFlags({ sendFails: false });
  expect(await system.list()).toEqual([]);
  expect((await system.quota()).remaining).toBe(3);
});

test('without connection every operation fails', async () => {
  const { system } = setup({ flags: { connection: 'offline' } });

  await expect(system.list()).rejects.toBeInstanceOf(StationUnavailableError);
  await expect(system.quota()).rejects.toBeInstanceOf(StationUnavailableError);
  await expect(system.submitRequest({ song: track('t_0001') })).rejects.toBeInstanceOf(
    StationUnavailableError,
  );
});

test('the studio accepts or rejects a wish', async () => {
  const { system } = setup();
  const [newest] = await system.list();

  const updated = await system.setStatus(newest.id, 'accepted');

  expect(updated.status).toBe('accepted');
  expect((await system.list()).find((w) => w.id === newest.id)?.status).toBe('accepted');
});

test('changing the status of an unknown wish fails', async () => {
  await expect(setup().system.setStatus('w_99' as WishId, 'accepted')).rejects.toThrow(RangeError);
});

test('returned wishes are copies', async () => {
  const { system } = setup({ wishes: [] });
  const wish = await system.submitRequest({ song: track('t_0001') });

  wish.votes = 99;

  expect((await system.list())[0].votes).toBe(1);
});
