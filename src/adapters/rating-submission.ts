import type { Rating, RatingInput, Score } from '@/domain/rating';
import { isShowRatingOpen } from '@/domain/rating-validation';
import type { FeedbackHub } from '@/ports/feedback-hub';

import {
  checkRatingEligibility,
  type RatingEligibility,
  type RatingTarget,
} from './rating-eligibility';
import { rememberRatingOnDevice } from './rating-history';
import { submitRatingAndRemember } from './submit-rating';

type Result =
  | { status: Exclude<RatingEligibility, 'allowed'> | 'busy' | 'awaitingLocalSave' }
  | { status: 'sent'; rating: Rating; remembered: boolean };

export function createRatingSubmission(feedbackHub: FeedbackHub) {
  let busy = false;
  let pendingRating: Rating | undefined;

  async function submit(
    target: RatingTarget,
    score: Score,
    comment: string | undefined,
    now: () => Date,
  ): Promise<Result> {
    if (busy) return { status: 'busy' };
    if (pendingRating) return { status: 'awaitingLocalSave' };
    busy = true;
    try {
      const eligibility = await checkRatingEligibility(target, now());
      if (eligibility !== 'allowed') return { status: eligibility };
      if (target.kind === 'show' && !isShowRatingOpen(target.show, now()))
        return { status: 'windowClosed' };
      const subject: RatingInput['subject'] =
        target.kind === 'track'
          ? { kind: 'track', trackId: target.trackId }
          : { kind: 'show', showId: target.show.id };
      const result = await submitRatingAndRemember(feedbackHub, { score, comment, subject });
      if (!result.remembered) pendingRating = result.rating;
      return { status: 'sent', ...result };
    } finally {
      busy = false;
    }
  }

  async function retryLocalSave(): Promise<boolean> {
    if (busy || !pendingRating) return false;
    busy = true;
    try {
      await rememberRatingOnDevice(pendingRating.subject);
      pendingRating = undefined;
      return true;
    } catch {
      return false;
    } finally {
      busy = false;
    }
  }

  return { submit, retryLocalSave };
}
