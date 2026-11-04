import type { DemoClock } from '@/demo/demo-clock';
import type { Score } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';

import type { RatingTarget } from './rating-eligibility';
import { clearDemoRatingHistory } from './rating-history';
import { createRatingSubmission } from './rating-submission';

export function createDemoRatingSubmission(
  feedbackHub: FeedbackHub,
  clock: DemoClock,
  resetOnStart = false,
) {
  let flow = createRatingSubmission(feedbackHub, 'demo');
  let revision = 0;
  let clearedRevision = resetOnStart ? -1 : 0;
  let busy = false;
  const unsubscribe = clock.subscribe(() => {
    revision++;
  });

  async function clearIfNeeded() {
    while (clearedRevision !== revision) {
      const currentRevision = revision;
      await clearDemoRatingHistory();
      flow = createRatingSubmission(feedbackHub, 'demo');
      clearedRevision = currentRevision;
    }
  }

  async function submit(target: RatingTarget, score: Score, comment?: string) {
    if (busy) return { status: 'busy' } as const;
    busy = true;
    try {
      await clearIfNeeded();
      const started = revision;
      try {
        const result = await flow.submit(target, score, comment, () => clock.now());
        if (started !== revision) {
          await clearIfNeeded();
          return { status: 'demoChanged' } as const;
        }
        return result;
      } catch (error) {
        if (started !== revision) await clearIfNeeded();
        throw error;
      }
    } finally {
      busy = false;
    }
  }

  async function retryLocalSave(): Promise<boolean> {
    if (busy) return false;
    busy = true;
    try {
      await clearIfNeeded();
      const started = revision;
      const saved = await flow.retryLocalSave();
      if (started !== revision) {
        await clearIfNeeded();
        return false;
      }
      return saved;
    } finally {
      busy = false;
    }
  }

  return { submit, retryLocalSave, dispose: unsubscribe };
}
