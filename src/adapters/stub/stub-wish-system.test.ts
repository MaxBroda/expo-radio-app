import { DemoClock } from '@/demo/demo-clock';
import { defaultFlags, type DemoFlags } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { TrackId } from '@/domain/track';
import type { Wish, WishId } from '@/domain/wish';
import { WishRejectedError } from '@/domain/wish-validation';

import { StubWishSystem } from './stub-wish-system';

const catalogSong = (id: string) => ({ kind: 'catalog', trackId: id as TrackId }) as const;

type HarnessOptions = {
  wishes?: Wish[];
  flags?: Partial<DemoFlags>;
};

function createHarness(options: HarnessOptions = {}) {
  let currentTime = new Date(2026, 9, 15, 18, 42);
  let currentFlags: DemoFlags = { ...defaultFlags, ...options.flags };

  const system = new StubWishSystem({
    now: () => currentTime,
    wishes: options.wishes,
    delayMs: 0,
    flags: () => currentFlags,
  });

  return {
    system,
    moveClock(minutes: number) {
      currentTime = new Date(currentTime.getTime() + minutes * 60_000);
    },
    changeFlags(patch: Partial<DemoFlags>) {
      currentFlags = { ...currentFlags, ...patch };
    },
  };
}

function wishFromAnotherListener(trackId: string): Wish {
  return {
    id: 'w_01' as WishId,
    song: catalogSong(trackId),
    createdAt: new Date(2026, 9, 15, 18, 0),
    votes: 4,
    status: 'open',
  };
}

describe('StubWishSystem', () => {
  it('returns seeded wishes ordered from newest to oldest', async () => {
    const wishes = await createHarness().system.list();

    expect(wishes).toHaveLength(10);
    expect(wishes[0].createdAt.getTime()).toBeGreaterThan(wishes[1].createdAt.getTime());
  });

  it('creates an open wish with one vote', async () => {
    const { system } = createHarness({ wishes: [] });

    const submitted = await system.submitRequest({
      song: catalogSong('t_0038'),
      greeting: 'Hallo',
    });

    expect(submitted).toMatchObject({
      song: catalogSong('t_0038'),
      greeting: 'Hallo',
      votes: 1,
      status: 'open',
    });
    await expect(system.list()).resolves.toEqual([submitted]);
  });

  it('stores the normalized form of a request', async () => {
    const { system } = createHarness({ wishes: [] });

    const submitted = await system.submitRequest({
      song: { kind: 'freeText', description: '  das Lied  mit dem Pfeifen ' },
      greeting: '   ',
    });

    expect(submitted.song).toEqual({
      kind: 'freeText',
      description: 'das Lied mit dem Pfeifen',
    });
    expect(submitted.greeting).toBeUndefined();
  });

  it('adds a vote to an existing open catalog wish', async () => {
    const { system } = createHarness({ wishes: [wishFromAnotherListener('t_0038')] });

    const updated = await system.submitRequest({
      song: catalogSong('t_0038'),
      greeting: 'Noch mal',
    });

    expect(updated).toMatchObject({ id: 'w_01', votes: 5, greeting: 'Noch mal' });
    await expect(system.list()).resolves.toHaveLength(1);
  });

  it('allows one vote per device and open song', async () => {
    const { system } = createHarness({ wishes: [wishFromAnotherListener('t_0038')] });
    await system.submitRequest({ song: catalogSong('t_0038') });

    await expect(system.submitRequest({ song: catalogSong('t_0038') })).rejects.toEqual(
      new WishRejectedError('alreadyRequested'),
    );

    expect((await system.list())[0].votes).toBe(5);
    expect((await system.quota()).remaining).toBe(2);
  });

  it('keeps quota and votes separate for each listener while sharing wishes', async () => {
    const { system, changeFlags } = createHarness({ wishes: [] });
    const input = { song: catalogSong('t_0038') };
    await system.submitRequest(input);
    await expect(system.submitRequest(input)).rejects.toEqual(
      new WishRejectedError('alreadyRequested'),
    );
    changeFlags({ listener: 2 });
    expect((await system.quota()).remaining).toBe(3);
    expect((await system.submitRequest(input)).votes).toBe(2);
    expect((await system.quota()).remaining).toBe(2);
    changeFlags({ listener: 1 });
    expect((await system.quota()).remaining).toBe(2);
    expect(await system.list()).toHaveLength(1);
  });

  it('resets wishes and all listeners after a demo clock jump', async () => {
    const clock = new DemoClock(new Date(2026, 9, 15, 18, 42), () => 0);
    let flags = { ...defaultFlags };
    const system = new StubWishSystem({
      now: () => clock.now(),
      demoClock: clock,
      wishes: [],
      delayMs: 0,
      flags: () => flags,
    });
    const input = { song: catalogSong('t_0038') };
    await system.submitRequest(input);
    flags = { ...flags, listener: 2 };
    await system.submitRequest(input);
    clock.jumpTo(clock.now());
    expect((await system.quota()).remaining).toBe(3);
    expect(await system.list()).toEqual([]);
    flags = { ...flags, listener: 1 };
    expect((await system.quota()).remaining).toBe(3);
    expect((await system.submitRequest(input)).votes).toBe(1);
  });

  it('keeps an in-flight request with the listener who started it', async () => {
    let flags = { ...defaultFlags };
    const system = new StubWishSystem({ wishes: [], delayMs: 20, flags: () => flags });
    const pending = system.submitRequest({ song: catalogSong('t_0038') });
    flags = { ...flags, listener: 2 };
    await pending;
    expect((await system.quota()).remaining).toBe(3);
    flags = { ...flags, listener: 1 };
    expect((await system.quota()).remaining).toBe(2);
  });

  it('does not send a request started before a demo clock jump', async () => {
    const clock = new DemoClock(new Date(2026, 9, 15, 18, 42), () => 0);
    const system = new StubWishSystem({
      now: () => clock.now(),
      demoClock: clock,
      wishes: [],
      delayMs: 20,
    });
    const pending = system.submitRequest({ song: catalogSong('t_0038') });
    clock.jumpTo(clock.now());
    await expect(pending).rejects.toBeInstanceOf(StationUnavailableError);
    expect(await system.list()).toEqual([]);
  });

  it('does not allow an additional vote for a newly created own wish', async () => {
    const { system } = createHarness({ wishes: [] });
    await system.submitRequest({ song: catalogSong('t_0038') });

    await expect(system.submitRequest({ song: catalogSong('t_0038') })).rejects.toEqual(
      new WishRejectedError('alreadyRequested'),
    );
    await expect(system.list()).resolves.toHaveLength(1);
  });

  it('compares own free-text requests without considering case', async () => {
    const { system } = createHarness({ wishes: [] });
    await system.submitRequest({
      song: { kind: 'freeText', description: 'Pfeifen am Anfang' },
    });

    await expect(
      system.submitRequest({
        song: { kind: 'freeText', description: 'pfeifen  am anfang' },
      }),
    ).rejects.toEqual(new WishRejectedError('alreadyRequested'));
    await expect(system.list()).resolves.toHaveLength(1);
  });

  it('accepts the same song again after its previous wish was decided', async () => {
    const { system } = createHarness({ wishes: [] });
    const first = await system.submitRequest({ song: catalogSong('t_0038') });
    await system.setStatus(first.id, 'rejected');

    const second = await system.submitRequest({ song: catalogSong('t_0038') });

    expect(second.id).not.toBe(first.id);
    await expect(system.list()).resolves.toHaveLength(2);
  });

  it('validates requests at the adapter boundary', async () => {
    const { system } = createHarness();

    await expect(
      system.submitRequest({ song: { kind: 'freeText', description: 'ab' } }),
    ).rejects.toEqual(new WishRejectedError('freeTextTooShort'));
  });

  it('blocks a fourth request until the next full hour', async () => {
    const { system, moveClock } = createHarness({ wishes: [] });

    for (const id of ['t_0001', 't_0002', 't_0003']) {
      await system.submitRequest({ song: catalogSong(id) });
    }

    await expect(system.quota()).resolves.toMatchObject({ remaining: 0, exhausted: true });
    await expect(system.submitRequest({ song: catalogSong('t_0004') })).rejects.toEqual(
      new WishRejectedError('quotaExhausted'),
    );

    moveClock(18);

    await expect(system.quota()).resolves.toMatchObject({ remaining: 3, exhausted: false });
    await expect(system.submitRequest({ song: catalogSong('t_0004') })).resolves.toBeTruthy();
  });

  it('can force an exhausted quota through the demo flags', async () => {
    const { system } = createHarness({ flags: { quotaExhausted: true } });

    await expect(system.quota()).resolves.toMatchObject({
      used: 3,
      remaining: 0,
      exhausted: true,
    });
    await expect(system.submitRequest({ song: catalogSong('t_0001') })).rejects.toEqual(
      new WishRejectedError('quotaExhausted'),
    );
  });

  it('does not modify list or quota when sending fails', async () => {
    const { system, changeFlags } = createHarness({
      wishes: [],
      flags: { sendFails: true },
    });

    await expect(system.submitRequest({ song: catalogSong('t_0001') })).rejects.toBeInstanceOf(
      StationUnavailableError,
    );

    changeFlags({ sendFails: false });

    await expect(system.list()).resolves.toEqual([]);
    expect((await system.quota()).remaining).toBe(3);
  });

  it('fails every operation without a connection', async () => {
    const { system } = createHarness({ flags: { connection: 'offline' } });

    await expect(system.list()).rejects.toBeInstanceOf(StationUnavailableError);
    await expect(system.quota()).rejects.toBeInstanceOf(StationUnavailableError);
    await expect(system.submitRequest({ song: catalogSong('t_0001') })).rejects.toBeInstanceOf(
      StationUnavailableError,
    );
  });

  it('updates the status selected by the studio', async () => {
    const { system } = createHarness();
    const [newest] = await system.list();

    const updated = await system.setStatus(newest.id, 'accepted');

    expect(updated.status).toBe('accepted');
    expect((await system.list()).find(({ id }) => id === newest.id)?.status).toBe('accepted');
  });

  it('rejects a status update for an unknown id', async () => {
    const { system } = createHarness();

    await expect(system.setStatus('w_99' as WishId, 'accepted')).rejects.toThrow(RangeError);
  });

  it('returns copies instead of exposing stored wish objects', async () => {
    const { system } = createHarness({ wishes: [] });
    const submitted = await system.submitRequest({ song: catalogSong('t_0001') });

    submitted.votes = 99;

    expect((await system.list())[0].votes).toBe(1);
  });
});
