import type { Rating, RatingInput } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';

import { rememberRatingOnDevice } from './rating-history';

export async function submitRatingAndRemember(
  feedbackHub: FeedbackHub,
  input: RatingInput,
): Promise<{ rating: Rating; remembered: boolean }> {
  const rating = await feedbackHub.submitRating(input);
  try {
    await rememberRatingOnDevice(rating.subject);
    return { rating, remembered: true };
  } catch {
    return { rating, remembered: false };
  }
}
