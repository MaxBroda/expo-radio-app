import { demoDay } from '@/demo/demo-clock';
import { defaultFlags, type DemoFlags } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import { catalog } from '@/seed/catalog';
import { Rotation } from '@/seed/rotation';
import { schedule } from '@/seed/schedule';

import { StubPlayout } from './stub-playout';

function setup(options: { flags?: Partial<DemoFlags> } = {}) {
  let now = new Date(2026, 9, 15, 18, 42);
  const flags: DemoFlags = { ...defaultFlags, ...options.flags };
  const playout = new StubPlayout({ now: () => now, delayMs: 0, flags: () => flags });
  return {
    playout,
    advance: (minutes: number) => (now = new Date(now.getTime() + minutes * 60_000)),
  };
}

test('the current track has started and not yet ended, inside the show on air', async () => {
  const { playout } = setup();
  const now = new Date(2026, 9, 15, 18, 42);

  const current = await playout.getNowPlaying();

  expect(current.startedAt.getTime()).toBeLessThanOrEqual(now.getTime());
  expect(current.startedAt.getTime() + current.track.durationSec! * 1000).toBeGreaterThan(
    now.getTime(),
  );
  expect(current.show).toMatchObject({ title: 'Feierabendwelle', hostName: 'Lena Osterkamp' });
});

test('returns plain tracks without seed details', async () => {
  const { track } = await setup().playout.getNowPlaying();

  expect(track).not.toHaveProperty('showProfile');
});

test('history is newest first, ends where the current track starts and has no gaps', async () => {
  const { playout } = setup();

  const current = await playout.getNowPlaying();
  const history = await playout.getHistory(20);

  expect(history).toHaveLength(20);
  expect(history.map((p) => p.track.id)).not.toContain(current.track.id);
  const starts = [current, ...history].map((p) => p.startedAt.getTime());
  [current, ...history].slice(1).forEach((played, i) => {
    expect(played.startedAt.getTime() + played.track.durationSec! * 1000).toBe(starts[i]);
  });
});

test('names the same tracks as the rotation behind the seeded ratings', async () => {
  const now = new Date(2026, 9, 15, 18, 42);
  const rotation = new Rotation(catalog, schedule, demoDay);

  const current = await setup().playout.getNowPlaying();

  expect(current.track.id).toBe(rotation.at(now).track.id);
});

test('moves on to the next track as time passes', async () => {
  const { playout, advance } = setup();
  const first = await playout.getNowPlaying();

  advance(first.track.durationSec! / 60 + 1);

  expect((await playout.getNowPlaying()).startedAt.getTime()).toBeGreaterThan(
    first.startedAt.getTime(),
  );
});

test('the empty history state returns no tracks but keeps the current one', async () => {
  const { playout } = setup({ flags: { emptyHistory: true } });

  expect(await playout.getHistory(20)).toEqual([]);
  await expect(playout.getNowPlaying()).resolves.toBeDefined();
});

test('fails while offline', async () => {
  const { playout } = setup({ flags: { connection: 'offline' } });

  await expect(playout.getNowPlaying()).rejects.toBeInstanceOf(StationUnavailableError);
  await expect(playout.getHistory(20)).rejects.toBeInstanceOf(StationUnavailableError);
});
