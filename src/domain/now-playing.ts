import type { Show } from './show';
import type { PlayedTrack } from './track';

export type NowPlaying = PlayedTrack & {
  show: Show;
};
