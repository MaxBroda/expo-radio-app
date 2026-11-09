import { createContext, use, useEffect, useMemo, type PropsWithChildren } from 'react';

import { createDemoRatingSubmission } from '@/adapters/demo-rating-submission';
import { demoDay, type DemoClock } from '@/demo/demo-clock';
import type { DemoSettings } from '@/demo/demo-settings';
import type { FeedbackHub } from '@/ports/feedback-hub';
import { catalog } from '@/seed/catalog';
import { ownDemoRatings } from '@/seed/own-ratings';
import { Rotation } from '@/seed/rotation';
import { schedule } from '@/seed/schedule';

const rotation = new Rotation(catalog, schedule, demoDay);

type RatingSubmission = ReturnType<typeof createDemoRatingSubmission>;
const RatingContext = createContext<RatingSubmission | null>(null);

export function RatingProvider({
  clock,
  feedbackHub,
  settings,
  children,
}: PropsWithChildren<{ clock: DemoClock; feedbackHub: FeedbackHub; settings?: DemoSettings }>) {
  const submission = useMemo(
    () =>
      createDemoRatingSubmission(feedbackHub, clock, {
        resetOnStart: true,
        subscribeOnCreate: false,
        seed: (now) => ownDemoRatings(rotation, now),
        listener: settings ? () => settings.get().listener : undefined,
      }),
    [clock, feedbackHub, settings],
  );

  useEffect(() => {
    submission.start();
    return () => submission.dispose();
  }, [submission]);

  return <RatingContext value={submission}>{children}</RatingContext>;
}

export function useRatingSubmission(): RatingSubmission {
  const submission = use(RatingContext);
  if (!submission) throw new Error('useRatingSubmission must be used inside RatingProvider');
  return submission;
}
