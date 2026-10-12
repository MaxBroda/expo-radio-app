import { NotImplementedError } from '@/domain/errors';
import type { Rating, RatingInput } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';

export class StubFeedbackHub implements FeedbackHub {
  async submitRating(_input: RatingInput): Promise<Rating> {
    throw new NotImplementedError('FeedbackHub.submitRating');
  }

  async list(): Promise<Rating[]> {
    throw new NotImplementedError('FeedbackHub.list');
  }
}
