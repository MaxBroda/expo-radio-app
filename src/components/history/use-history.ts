import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDemo } from '@/demo/demo-provider';
import type { PlayedTrack } from '@/domain/track';
import { useStations } from '@/stations/stations-provider';

export type HistoryState =
  { status: 'loading' } | { status: 'loaded'; tracks: PlayedTrack[] } | { status: 'failed' };

const historyLength = 20;

/** Refreshes quietly on focus so swiping between tabs keeps the list; a demo change shows loading. */
export function useHistory(): { state: HistoryState; retry: () => void } {
  const { playout } = useStations();
  const { clock, settings } = useDemo();
  const [state, setState] = useState<HistoryState>({ status: 'loading' });
  const cancelPending = useRef(() => {});

  const load = useCallback(
    (quiet = false) => {
      cancelPending.current();
      let current = true;
      cancelPending.current = () => (current = false);
      if (!quiet) setState({ status: 'loading' });
      playout.getHistory(historyLength).then(
        (tracks) => current && setState({ status: 'loaded', tracks }),
        () => current && setState({ status: 'failed' }),
      );
    },
    [playout],
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
