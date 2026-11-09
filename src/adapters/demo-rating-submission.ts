import type { DemoClock } from '@/demo/demo-clock';
import type { DemoListener } from '@/demo/demo-settings';
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
  listener?: () => DemoListener;
};

export function createDemoRatingSubmission(
  feedbackHub: FeedbackHub,
  clock: DemoClock,
  { resetOnStart = false, subscribeOnCreate = true, seed = () => [], listener }: Options = {},
) {
  const flows = new Map<DemoListener | 'demo', ReturnType<typeof createRatingSubmission>>();
  const currentListener = () => listener?.() ?? 'demo';
  const scopeFor = (selected: DemoListener | 'demo') =>
    selected === 'demo' ? 'demo' : ({ listener: selected } as const);
  function flowFor(selected: DemoListener | 'demo') {
    let flow = flows.get(selected);
    if (!flow) {
      flow = createRatingSubmission(feedbackHub, scopeFor(selected));
      flows.set(selected, flow);
    }
    return flow;
  }
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
        await rememberRatingOnDevice(subject, score, scopeFor(listener ? 1 : 'demo'));
      flows.clear();
      clearedRevision = currentRevision;
    }
  }

  async function submit(target: RatingTarget, score: Score, comment?: string) {
    if (busy) return { status: 'busy' } as const;
    const selected = currentListener();
    busy = true;
    try {
      await clearIfNeeded();
      const started = revision;
      try {
        const result = await flowFor(selected).submit(
          target,
          score,
          comment,
          () => clock.now(),
          () => started === revision && selected === currentListener(),
        );
        if (started !== revision) {
          await clearIfNeeded();
          return { status: 'demoChanged' } as const;
        }
        if (selected !== currentListener()) return { status: 'demoChanged' } as const;
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
    const selected = currentListener();
    busy = true;
    try {
      await clearIfNeeded();
      const started = revision;
      const saved = await flowFor(selected).retryLocalSave();
      if (started !== revision) {
        await clearIfNeeded();
        return false;
      }
      return selected === currentListener() && saved;
    } finally {
      busy = false;
    }
  }

  async function ratedScore(subject: RatingSubject): Promise<Score | undefined> {
    if (!busy) await clearIfNeeded();
    return ratedScoreOnDevice(subject, scopeFor(currentListener()));
  }

  async function trackScores() {
    if (!busy) await clearIfNeeded();
    return trackScoresOnDevice(scopeFor(currentListener()));
  }

  return { submit, retryLocalSave, ratedScore, trackScores, start, dispose };
}
