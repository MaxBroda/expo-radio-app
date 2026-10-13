import type { Rating } from '@/domain/rating';

import { catalog } from './catalog';
import { buildDemoSeed, DemoRatings } from './demo-seed';
import { Random } from './random';
import { Rotation } from './rotation';
import { schedule } from './schedule';

const epoch = new Date(2026, 9, 15);
const evening = new Date(2026, 9, 15, 18, 42);
const night = new Date(2026, 9, 15, 23, 42);

function build(now: Date) {
  const rotation = new Rotation(catalog, schedule, epoch);
  const ratings = new DemoRatings(rotation, schedule, new Random(42));
  return { rotation, seed: buildDemoSeed(now, { rotation, ratings, catalog }) };
}

const withinMinutes = (ratings: Rating[], now: Date, minutes: number) =>
  ratings.filter((r) => now.getTime() - r.createdAt.getTime() <= minutes * 60_000);

const average = (ratings: Rating[]) =>
  ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;

test('the same time builds the same seed', () => {
  expect(build(evening).seed).toEqual(build(evening).seed);
});

test('history shows the last 20 tracks from the catalog', () => {
  const { seed } = build(evening);
  const ids = new Set(catalog.map((t) => t.id));

  expect(seed.history).toHaveLength(20);
  expect(seed.history.every((p) => ids.has(p.track.id))).toBe(true);
});

test('the dashboard window matches the design', () => {
  const window = withinMinutes(build(evening).seed.ratings, evening, 15);

  expect(window.length).toBeGreaterThanOrEqual(15);
  expect(window.length).toBeLessThanOrEqual(20);
  expect(average(window)).toBeGreaterThanOrEqual(3.7);
  expect(average(window)).toBeLessThanOrEqual(4.1);
});

test('the day holds clearly more ratings than the window', () => {
  expect(build(evening).seed.ratings.length).toBeGreaterThanOrEqual(60);
});

test('ratings are newest first and never in the future', () => {
  const { ratings } = build(evening).seed;
  const times = ratings.map((r) => r.createdAt.getTime());

  expect(times).toEqual([...times].sort((a, b) => b - a));
  expect(Math.max(...times)).toBeLessThanOrEqual(evening.getTime());
});

test('track ratings refer to what was playing at that moment', () => {
  const { rotation, seed } = build(evening);

  for (const rating of seed.ratings) {
    if (rating.subject.kind !== 'track') continue;
    expect(rotation.at(rating.createdAt).track.id).toBe(rating.subject.trackId);
  }
});

test('show ratings refer to the show on air at that moment', () => {
  const { seed } = build(evening);

  for (const rating of seed.ratings) {
    if (rating.subject.kind !== 'show') continue;
    expect(schedule.showAt(rating.createdAt).id).toBe(rating.subject.showId);
  }
});

test('nobody rates the unmoderated night slot', () => {
  const window = withinMinutes(build(night).seed.ratings, night, 40);

  expect(window.length).toBeGreaterThan(0);
  expect(window.some((r) => r.subject.kind === 'show')).toBe(false);
});

test('wishes cover every state the studio list shows', () => {
  const { wishes } = build(evening).seed;
  const ids = new Set(catalog.map((t) => t.id));
  const votes = wishes.map((w) => w.votes);

  expect(wishes.length).toBeGreaterThanOrEqual(8);
  expect(wishes.length).toBeLessThanOrEqual(12);
  expect(new Set(wishes.map((w) => w.status))).toEqual(new Set(['open', 'accepted', 'rejected']));
  expect(wishes.filter((w) => w.status === 'open')).toHaveLength(3);
  expect(Math.min(...votes)).toBe(1);
  expect(Math.max(...votes)).toBeGreaterThanOrEqual(25);
  expect(wishes.some((w) => w.greeting)).toBe(true);

  const freeText = wishes.filter((w) => w.song.kind === 'freeText');
  expect(freeText.length).toBeGreaterThanOrEqual(1);
  expect(freeText.length).toBeLessThanOrEqual(2);
  for (const wish of wishes) {
    if (wish.song.kind === 'catalog') expect(ids.has(wish.song.trackId)).toBe(true);
  }
});

test('the rush state keeps adding ratings for the current moment', () => {
  const rotation = new Rotation(catalog, schedule, epoch);
  const ratings = new DemoRatings(rotation, schedule, new Random(1));
  const first = ratings.next(evening);
  const second = ratings.next(evening);

  expect(first.createdAt).toEqual(evening);
  expect(second.id).not.toBe(first.id);
});
