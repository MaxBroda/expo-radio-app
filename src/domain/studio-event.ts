import type { Rating } from './rating';
import type { Wish } from './wish';

export type StudioEvent = { type: 'rating'; rating: Rating } | { type: 'wish'; wish: Wish };
