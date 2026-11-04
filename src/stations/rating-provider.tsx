import { createContext, use, useEffect, useMemo, type PropsWithChildren } from 'react';

import { createDemoRatingSubmission } from '@/adapters/demo-rating-submission';
import type { DemoClock } from '@/demo/demo-clock';
import type { FeedbackHub } from '@/ports/feedback-hub';

type RatingSubmission = ReturnType<typeof createDemoRatingSubmission>;
const RatingContext = createContext<RatingSubmission | null>(null);

export function RatingProvider({
  clock,
  feedbackHub,
  children,
}: PropsWithChildren<{ clock: DemoClock; feedbackHub: FeedbackHub }>) {
  const submission = useMemo(
    () => createDemoRatingSubmission(feedbackHub, clock, true, false),
    [clock, feedbackHub],
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
