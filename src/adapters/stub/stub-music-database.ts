import { NotImplementedError } from '@/domain/errors';
import type { Track, TrackId } from '@/domain/track';
import type { MusicDatabase } from '@/ports/music-database';

export class StubMusicDatabase implements MusicDatabase {
  async search(_query: string): Promise<Track[]> {
    throw new NotImplementedError('MusicDatabase.search');
  }

  async lookup(_id: TrackId): Promise<Track | undefined> {
    throw new NotImplementedError('MusicDatabase.lookup');
  }
}
