import type { Connection } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { TrackId } from '@/domain/track';

import { searchLimits, StubMusicDatabase } from './stub-music-database';

function database(connection: Connection = 'online') {
  return new StubMusicDatabase({ delayMs: 0, connection: () => connection });
}

const titles = (tracks: { title: string }[]) => tracks.map((t) => t.title);

test('finds tracks by title or artist, ignoring case', async () => {
  expect(titles(await database().search('GRÖNEMEYER'))).toEqual(['Männer', 'Mensch']);
});

test.each([
  ['gronemeyer', 'Männer'],
  ['barfuss', 'Barfuß am Klavier'],
  ['jose gonzalez', 'Heartbeats'],
])('ignores accents and umlauts: %s', async (query, title) => {
  expect(titles(await database().search(query))).toContain(title);
});

test('every word has to match', async () => {
  expect(titles(await database().search('herbert männer'))).toEqual(['Männer']);
});

test('titles starting with the query come first', async () => {
  expect(titles(await database().search('night'))).toEqual(['Nightcall', 'Midnight City']);
});

test('queries below the minimum length return nothing', async () => {
  expect(await database().search('a')).toEqual([]);
  expect(await database().search('  ')).toEqual([]);
});

test('results are limited', async () => {
  expect(await database().search('an')).toHaveLength(searchLimits.maxResults);
});

test('an unknown song returns no hits, which leads to a free text wish', async () => {
  expect(await database().search('pfeifen am anfang')).toEqual([]);
});

test('lookup returns the track without seed fields', async () => {
  const track = await database().lookup('t_0038' as TrackId);

  expect(track).toEqual({
    id: 't_0038',
    title: 'Mensch',
    artist: 'Herbert Grönemeyer',
    album: expect.any(String),
    year: expect.any(Number),
    durationSec: expect.any(Number),
  });
});

test('lookup of an unknown id returns undefined', async () => {
  expect(await database().lookup('t_9999' as TrackId)).toBeUndefined();
});

test('without connection both operations fail', async () => {
  await expect(database('offline').search('mensch')).rejects.toBeInstanceOf(
    StationUnavailableError,
  );
  await expect(database('offline').lookup('t_0038' as TrackId)).rejects.toBeInstanceOf(
    StationUnavailableError,
  );
});
