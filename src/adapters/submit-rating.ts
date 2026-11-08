import type { Rating, RatingInput } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';

import { rememberRatingOnDevice, type HistoryScope } from './rating-history';

export async function submitRatingAndRemember(
  feedbackHub: FeedbackHub,
  input: RatingInput,
  scope: HistoryScope = 'device',
): Promise<{ rating: Rating; remembered: boolean }> {
  const rating = await feedbackHub.submitRating(input);
  try {
    await rememberRatingOnDevice(rating.subject, rating.score, scope);
    return { rating, remembered: true };
  } catch {
    return { rating, remembered: false };
  }
}
