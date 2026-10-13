import type { Track, TrackId } from '@/domain/track';

import entries from './catalog.json';
import type { SlotKey } from './schedule';

/** Metadata from MusicBrainz (CC0). Covers stay generated placeholders. */
export type CatalogTrack = Track & {
  album: string;
  year: number;
  durationSec: number;
  showProfile: readonly SlotKey[];
};

export const catalog: readonly CatalogTrack[] = entries.map((entry) => ({
  ...entry,
  id: entry.id as TrackId,
  showProfile: entry.showProfile as SlotKey[],
}));
