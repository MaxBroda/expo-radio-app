import type { Rating, RatingId, RatingInput } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';

export class StubFeedbackHub implements FeedbackHub {
  private ratings: Rating[] = [];
  private nextId = 1;

  async submitRating(input: RatingInput): Promise<Rating> {
    const rating: Rating = {
      ...input,
      id: `rating-${this.nextId++}` as RatingId,
      createdAt: new Date(),
    };
    this.ratings.unshift(rating);
    return rating;
  }

  async list(): Promise<Rating[]> {
    return [...this.ratings];
  }
}
