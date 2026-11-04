import type { Rating, RatingInput, Score } from '@/domain/rating';
import { isShowRatingOpen } from '@/domain/rating-validation';
import type { FeedbackHub } from '@/ports/feedback-hub';

import {
  checkRatingEligibility,
  type RatingEligibility,
  type RatingTarget,
} from './rating-eligibility';
import { rememberRatingOnDevice, type HistoryScope } from './rating-history';
import { submitRatingAndRemember } from './submit-rating';

type Result =
  | { status: Exclude<RatingEligibility, 'allowed'> | 'busy' | 'awaitingLocalSave' | 'demoChanged' }
  | { status: 'sent'; rating: Rating; remembered: boolean };

export function createRatingSubmission(feedbackHub: FeedbackHub, scope: HistoryScope = 'device') {
  let busy = false;
  let pendingRating: Rating | undefined;

  async function submit(
    target: RatingTarget,
    score: Score,
    comment: string | undefined,
    now: () => Date,
    isCurrent: () => boolean = () => true,
  ): Promise<Result> {
    if (busy) return { status: 'busy' };
    if (pendingRating) return { status: 'awaitingLocalSave' };
    busy = true;
    try {
      const eligibility = await checkRatingEligibility(target, now(), scope);
      if (!isCurrent()) return { status: 'demoChanged' };
      if (eligibility !== 'allowed') return { status: eligibility };
      if (target.kind === 'show' && !isShowRatingOpen(target.show, now()))
        return { status: 'windowClosed' };
      const subject: RatingInput['subject'] =
        target.kind === 'track'
          ? { kind: 'track', trackId: target.trackId }
          : { kind: 'show', showId: target.show.id };
      const result = await submitRatingAndRemember(feedbackHub, { score, comment, subject }, scope);
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
      await rememberRatingOnDevice(pendingRating.subject, scope);
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
