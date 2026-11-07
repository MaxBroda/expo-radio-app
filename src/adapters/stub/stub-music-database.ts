import type { Connection } from '@/demo/demo-settings';
import type { Track, TrackId } from '@/domain/track';
import type { MusicDatabase } from '@/ports/music-database';
import { catalog as seedCatalog, type CatalogTrack } from '@/seed/catalog';

import { reachStation } from './reach-station';

export const searchLimits = { minQueryLength: 2, maxResults: 10 } as const;

type Options = {
  catalog?: readonly CatalogTrack[];
  delayMs?: number;
  connection?: () => Connection;
};

/** Lowercase without accents, so "beyonce" finds "Beyoncé" and "strasse" finds "Straße". */
function fold(text: string): string {
  return text
    .toLocaleLowerCase('de')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toTrack({ id, title, artist, album, year, durationSec }: CatalogTrack): Track {
  return { id, title, artist, album, year, durationSec };
}

type Indexed = { track: CatalogTrack; title: string; artist: string };

function rank(entry: Indexed, query: string): number {
  if (entry.title.startsWith(query)) return 0;
  if (entry.artist.startsWith(query)) return 1;
  return 2;
}

export class StubMusicDatabase implements MusicDatabase {
  private readonly index: Indexed[];
  private readonly delayMs: number;
  private readonly connection: () => Connection;

  constructor({ catalog = seedCatalog, delayMs = 300, connection = () => 'online' }: Options = {}) {
    this.index = catalog.map((track) => ({
      track,
      title: fold(track.title),
      artist: fold(track.artist),
    }));
    this.delayMs = delayMs;
    this.connection = connection;
  }

  async search(query: string): Promise<Track[]> {
    await this.reach();
    const folded = fold(query).replace(/\s+/g, ' ').trim();
    if (folded.length < searchLimits.minQueryLength) return [];

    const words = folded.split(' ');
    return this.index
      .filter((entry) => words.every((w) => entry.title.includes(w) || entry.artist.includes(w)))
      .sort((a, b) => rank(a, folded) - rank(b, folded) || a.title.localeCompare(b.title, 'de'))
      .slice(0, searchLimits.maxResults)
      .map((entry) => toTrack(entry.track));
  }

  async lookup(id: TrackId): Promise<Track | undefined> {
    await this.reach();
    const entry = this.index.find((e) => e.track.id === id);
    return entry && toTrack(entry.track);
  }

  private reach() {
    return reachStation('MusicDatabase', this.delayMs, this.connection);
  }
}
