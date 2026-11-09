import type { Connection } from '@/demo/demo-settings';
import type { Track, TrackId } from '@/domain/track';
import type { MusicDatabase } from '@/ports/music-database';
import { catalog as defaultCatalog, type CatalogTrack } from '@/seed/catalog';

import { reachStation } from './reach-station';

export const searchLimits = {
  minQueryLength: 2,
  maxResults: 10,
} as const;

type Options = {
  catalog?: readonly CatalogTrack[];
  delayMs?: number;
  connection?: () => Connection;
};

type SearchEntry = {
  source: CatalogTrack;
  titleKey: string;
  artistKey: string;
};

function searchKey(value: string): string {
  return value
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function exposeTrack(track: CatalogTrack): Track {
  const { id, title, artist, album, year, durationSec } = track;
  return { id, title, artist, album, year, durationSec };
}

function matchPriority(entry: SearchEntry, query: string): number {
  if (entry.titleKey.startsWith(query)) {
    return 0;
  }
  if (entry.artistKey.startsWith(query)) {
    return 1;
  }
  return 2;
}

export class StubMusicDatabase implements MusicDatabase {
  private readonly entries: SearchEntry[];
  private readonly latency: number;
  private readonly getConnection: () => Connection;

  constructor(options: Options = {}) {
    const { catalog = defaultCatalog, delayMs = 300, connection = () => 'online' } = options;

    this.entries = catalog.map((source) => ({
      source,
      titleKey: searchKey(source.title),
      artistKey: searchKey(source.artist),
    }));
    this.latency = delayMs;
    this.getConnection = connection;
  }

  async search(query: string): Promise<Track[]> {
    await this.ensureReachable();

    const normalizedQuery = searchKey(query).replace(/\s+/g, ' ').trim();
    if (normalizedQuery.length < searchLimits.minQueryLength) {
      return [];
    }

    const terms = normalizedQuery.split(' ');
    const matches = this.entries.filter(({ titleKey, artistKey }) =>
      terms.every((term) => titleKey.includes(term) || artistKey.includes(term)),
    );

    matches.sort((left, right) => {
      const priorityDifference =
        matchPriority(left, normalizedQuery) - matchPriority(right, normalizedQuery);

      return priorityDifference || left.titleKey.localeCompare(right.titleKey, 'de');
    });

    return matches.slice(0, searchLimits.maxResults).map(({ source }) => exposeTrack(source));
  }

  async lookup(id: TrackId): Promise<Track | undefined> {
    await this.ensureReachable();

    const found = this.entries.find(({ source }) => source.id === id);
    return found === undefined ? undefined : exposeTrack(found.source);
  }

  private ensureReachable(): Promise<void> {
    return reachStation('MusicDatabase', this.latency, this.getConnection);
  }
}
