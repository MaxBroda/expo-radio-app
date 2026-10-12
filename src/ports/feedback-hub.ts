import type { Rating, RatingInput } from '@/domain/rating';

export interface FeedbackHub {
  submitRating(input: RatingInput): Promise<Rating>;
  /** Newest first. */
  list(): Promise<Rating[]>;
}
