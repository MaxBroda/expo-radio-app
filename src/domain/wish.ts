import type { Brand } from './brand';
import type { TrackId } from './track';

export type WishId = Brand<string, 'WishId'>;

export type WishStatus = 'open' | 'accepted' | 'rejected';

export type WishedSong =
  { kind: 'catalog'; trackId: TrackId } | { kind: 'freeText'; description: string };

export type WishInput = {
  song: WishedSong;
  greeting?: string;
};

export type Wish = WishInput & {
  id: WishId;
  createdAt: Date;
  votes: number;
  status: WishStatus;
};
