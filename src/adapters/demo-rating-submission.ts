import type { DemoClock } from '@/demo/demo-clock';
import type { RatingSubject, Score } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';
import type { OwnRating } from '@/seed/own-ratings';

import type { RatingTarget } from './rating-eligibility';
import {
  clearDemoRatingHistory,
  ratedScoreOnDevice,
  rememberRatingOnDevice,
  trackScoresOnDevice,
} from './rating-history';
import { createRatingSubmission } from './rating-submission';

type Options = {
  /** Forgets demo ratings left over from an earlier app session. */
  resetOnStart?: boolean;
  /** Off when a React effect calls `start()` and `dispose()` instead. */
  subscribeOnCreate?: boolean;
  /** Written after every reset, so the demo starts with ratings of its own. */
  seed?: (now: Date) => OwnRating[];
};

export function createDemoRatingSubmission(
  feedbackHub: FeedbackHub,
  clock: DemoClock,
  { resetOnStart = false, subscribeOnCreate = true, seed = () => [] }: Options = {},
) {
  let flow = createRatingSubmission(feedbackHub, 'demo');
  let revision = 0;
  let clearedRevision = resetOnStart ? -1 : 0;
  let busy = false;
  let unsubscribe: (() => void) | undefined;

  function start() {
    if (!unsubscribe)
      unsubscribe = clock.subscribe(() => {
        revision++;
      });
  }

  function dispose() {
    unsubscribe?.();
    unsubscribe = undefined;
  }

  if (subscribeOnCreate) start();

  async function clearIfNeeded() {
    while (clearedRevision !== revision) {
      const currentRevision = revision;
      await clearDemoRatingHistory();
      for (const { subject, score } of seed(clock.now()))
        await rememberRatingOnDevice(subject, score, 'demo');
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
        const result = await flow.submit(
          target,
          score,
          comment,
          () => clock.now(),
          () => started === revision,
        );
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

  async function ratedScore(subject: RatingSubject): Promise<Score | undefined> {
    if (!busy) await clearIfNeeded();
    return ratedScoreOnDevice(subject, 'demo');
  }

  async function trackScores() {
    if (!busy) await clearIfNeeded();
    return trackScoresOnDevice('demo');
  }

  return { submit, retryLocalSave, ratedScore, trackScores, start, dispose };
}
