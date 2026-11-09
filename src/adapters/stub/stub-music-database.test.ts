import type { Connection } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { Track, TrackId } from '@/domain/track';

import { searchLimits, StubMusicDatabase } from './stub-music-database';

function createDatabase(connection: Connection = 'online') {
  return new StubMusicDatabase({
    delayMs: 0,
    connection: () => connection,
  });
}

const trackTitles = (tracks: Track[]) => tracks.map(({ title }) => title);

describe('StubMusicDatabase', () => {
  it('searches title and artist without considering letter case', async () => {
    const result = await createDatabase().search('GRÖNEMEYER');

    expect(trackTitles(result)).toEqual(['Männer', 'Mensch']);
  });

  it.each([
    ['gronemeyer', 'Männer'],
    ['barfuss', 'Barfuß am Klavier'],
    ['jose gonzalez', 'Heartbeats'],
  ])(
    'normalizes accents and special German characters in %s',
    async (query: string, expectedTitle: string) => {
      const titles = trackTitles(await createDatabase().search(query));

      expect(titles).toContain(expectedTitle);
    },
  );

  it('requires every search term to occur', async () => {
    const result = await createDatabase().search('herbert männer');

    expect(trackTitles(result)).toEqual(['Männer']);
  });

  it('ranks titles beginning with the complete query first', async () => {
    const result = await createDatabase().search('night');

    expect(trackTitles(result)).toEqual(['Nightcall', 'Midnight City']);
  });

  it.each(['a', '  '])(
    'returns no result for a query below the minimum: %j',
    async (query: string) => {
      await expect(createDatabase().search(query)).resolves.toEqual([]);
    },
  );

  it('caps the number of returned tracks', async () => {
    const result = await createDatabase().search('an');

    expect(result).toHaveLength(searchLimits.maxResults);
  });

  it('returns no track for an unknown description', async () => {
    await expect(createDatabase().search('pfeifen am anfang')).resolves.toEqual([]);
  });

  it('looks up a public track without catalog-only fields', async () => {
    const result = await createDatabase().lookup('t_0038' as TrackId);

    expect(result).toEqual({
      id: 't_0038',
      title: 'Mensch',
      artist: 'Herbert Grönemeyer',
      album: expect.any(String),
      year: expect.any(Number),
      durationSec: expect.any(Number),
    });
  });

  it('returns undefined when a track id is unknown', async () => {
    await expect(createDatabase().lookup('t_9999' as TrackId)).resolves.toBeUndefined();
  });

  it('rejects search and lookup while offline', async () => {
    const database = createDatabase('offline');

    await expect(database.search('mensch')).rejects.toBeInstanceOf(StationUnavailableError);
    await expect(database.lookup('t_0038' as TrackId)).rejects.toBeInstanceOf(
      StationUnavailableError,
    );
  });
});
