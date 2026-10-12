import type { Track, TrackId } from '@/domain/track';

export interface MusicDatabase {
  search(query: string): Promise<Track[]>;
  lookup(id: TrackId): Promise<Track | undefined>;
}
