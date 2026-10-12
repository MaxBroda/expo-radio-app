import { NotImplementedError } from '@/domain/errors';
import type { NowPlaying } from '@/domain/now-playing';
import type { PlayedTrack } from '@/domain/track';
import type { Playout } from '@/ports/playout';

export class StubPlayout implements Playout {
  async getNowPlaying(): Promise<NowPlaying> {
    throw new NotImplementedError('Playout.getNowPlaying');
  }

  async getHistory(_limit: number): Promise<PlayedTrack[]> {
    throw new NotImplementedError('Playout.getHistory');
  }
}
