import { catalog } from './catalog';
import { Rotation } from './rotation';
import { schedule } from './schedule';

const epoch = new Date(2026, 9, 15);
const now = new Date(2026, 9, 15, 18, 42);

const rotation = () => new Rotation(catalog, schedule, epoch);

test('the same epoch plays the same sequence', () => {
  const ids = (r: Rotation) => r.history(now, 20).map((p) => p.track.id);

  expect(ids(rotation())).toEqual(ids(rotation()));
});

test('the current track covers the requested time', () => {
  const current = rotation().at(now);

  expect(current.startedAt.getTime()).toBeLessThanOrEqual(now.getTime());
  expect(current.endsAt.getTime()).toBeGreaterThan(now.getTime());
});

test('history runs back-to-back up to the current track', () => {
  const r = rotation();
  const [latest, ...older] = r.history(now, 20);

  expect(latest.endsAt).toEqual(r.at(now).startedAt);
  older.forEach((played, i) => {
    const newer = i === 0 ? latest : older[i - 1];
    expect(played.endsAt).toEqual(newer.startedAt);
  });
});

test('every track fits the slot it starts in', () => {
  const r = rotation();
  const played = [r.at(now), ...r.history(now, 60)];

  for (const p of played) {
    expect(p.track.showProfile).toContain(schedule.slotAt(p.startedAt).key);
  }
});

test('no track repeats within the visible history', () => {
  const ids = rotation()
    .history(now, 20)
    .map((p) => p.track.id);

  expect(new Set(ids).size).toBe(ids.length);
});
