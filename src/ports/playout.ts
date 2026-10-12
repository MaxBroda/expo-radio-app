import type { NowPlaying } from '@/domain/now-playing';
import type { PlayedTrack } from '@/domain/track';

export interface Playout {
  getNowPlaying(): Promise<NowPlaying>;
  /** Newest first. */
  getHistory(limit: number): Promise<PlayedTrack[]>;
}
