import type { Brand } from './brand';
import type { ShowId } from './show';
import type { TrackId } from './track';

export type RatingId = Brand<string, 'RatingId'>;

export type Score = 1 | 2 | 3 | 4 | 5;

export const ratingCommentMaxLength = 240;

export type RatingSubject = { kind: 'track'; trackId: TrackId } | { kind: 'show'; showId: ShowId };

export type RatingInput = {
  score: Score;
  comment?: string;
  subject: RatingSubject;
};

export type Rating = RatingInput & {
  id: RatingId;
  createdAt: Date;
};

export function isRatingCommentValid(comment?: string): boolean {
  return comment === undefined || comment.length <= ratingCommentMaxLength;
}
