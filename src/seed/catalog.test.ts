import { catalog } from './catalog';
import { slots } from './schedule';

const matches = (query: string) =>
  catalog.filter((t) => `${t.title} ${t.artist}`.toLowerCase().includes(query.toLowerCase()));

test('the catalog stays within the agreed size', () => {
  expect(catalog.length).toBeGreaterThanOrEqual(100);
  expect(catalog.length).toBeLessThanOrEqual(300);
});

test('track ids are unique', () => {
  expect(new Set(catalog.map((t) => t.id)).size).toBe(catalog.length);
});

test('every slot has enough tracks to rotate', () => {
  for (const slot of slots) {
    expect(catalog.filter((t) => t.showProfile.includes(slot.key)).length).toBeGreaterThan(20);
  }
});

test.each(['ligh', 'chi', 'tage', 'kid', 'nigh'])('short query %s finds a handful', (query) => {
  const hits = matches(query).length;

  expect(hits).toBeGreaterThanOrEqual(2);
  expect(hits).toBeLessThanOrEqual(6);
});

test('the free text example finds nothing', () => {
  expect(matches('Zugvogel')).toHaveLength(0);
});
