import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDemo } from '@/demo/demo-provider';
import type { Score } from '@/domain/rating';
import type { PlayedTrack, TrackId } from '@/domain/track';
import { useRatingSubmission } from '@/stations/rating-provider';
import { useStations } from '@/stations/stations-provider';

export type HistoryState =
  | { status: 'loading' }
  | { status: 'loaded'; tracks: PlayedTrack[]; scores: Map<TrackId, Score> }
  | { status: 'failed' };

export const historyLength = 20;

/**
 * Refreshes quietly on focus, so swiping between tabs keeps the list and a rating made in the
 * modal shows up on return; a demo change shows loading.
 */
export function useHistory(): { state: HistoryState; retry: () => void } {
  const { playout } = useStations();
  const ratings = useRatingSubmission();
  const { clock, settings } = useDemo();
  const [state, setState] = useState<HistoryState>({ status: 'loading' });
  const cancelPending = useRef(() => {});

  const load = useCallback(
    (quiet = false) => {
      cancelPending.current();
      let current = true;
      cancelPending.current = () => (current = false);
      if (!quiet) setState({ status: 'loading' });
      // Missing scores only hide the badges, the list itself is still right.
      const scores = ratings.trackScores().catch(() => new Map<TrackId, Score>());
      Promise.all([playout.getHistory(historyLength), scores]).then(
        ([tracks, scores]) => current && setState({ status: 'loaded', tracks, scores }),
        () => current && setState({ status: 'failed' }),
      );
    },
    [playout, ratings],
  );

  useFocusEffect(useCallback(() => load(true), [load]));

  // Not tied to focus: the demo sheet is a modal, so the screen below is blurred while it changes.
  useEffect(() => {
    const reload = () => load();
    const unsubscribe = [settings.subscribe(reload), clock.subscribe(reload)];
    return () => {
      unsubscribe.forEach((stop) => stop());
      cancelPending.current();
    };
  }, [load, settings, clock]);

  return { state, retry: () => load() };
}
