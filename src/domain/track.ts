import type { Brand } from './brand';

export type TrackId = Brand<string, 'TrackId'>;

export type Track = {
  id: TrackId;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  durationSec?: number;
};

export type PlayedTrack = {
  track: Track;
  startedAt: Date;
};
