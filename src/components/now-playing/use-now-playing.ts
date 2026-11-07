import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useDemo } from '@/demo/demo-provider';
import type { NowPlaying } from '@/domain/now-playing';
import { useStations } from '@/stations/stations-provider';

export type Snapshot = { playing: NowPlaying; fetchedAt: Date };

export type NowPlayingState =
  | { status: 'connecting' }
  | { status: 'live'; snapshot: Snapshot }
  | { status: 'offline'; last?: Snapshot };

/**
 * Refreshes quietly on focus and when the track ends, so swiping between tabs keeps the track on
 * screen; a demo change shows the loading state. While offline the last known track stays
 * visible, but only until the demo clock jumps, after which it would be misleading.
 */
export function useNowPlaying(): { state: NowPlayingState; retry: () => void } {
  const { playout } = useStations();
  const { clock, settings } = useDemo();
  const [state, setState] = useState<NowPlayingState>({ status: 'connecting' });
  const last = useRef<Snapshot | undefined>(undefined);
  const revision = useRef(clock.revision);
  const cancelPending = useRef(() => {});

  const load = useCallback(
    (silent: boolean) => {
      cancelPending.current();
      let current = true;
      cancelPending.current = () => (current = false);
      if (revision.current !== clock.revision) {
        revision.current = clock.revision;
        last.current = undefined;
      }
      if (!silent) setState({ status: 'connecting' });
      playout.getNowPlaying().then(
        (playing) => {
          if (!current) return;
          last.current = { playing, fetchedAt: clock.now() };
          setState({ status: 'live', snapshot: last.current });
        },
        () => current && setState({ status: 'offline', last: last.current }),
      );
    },
    [playout, clock],
  );

  useFocusEffect(useCallback(() => load(true), [load]));

  // Not tied to focus: the demo sheet is a modal, so the screen below is blurred while it changes.
  useEffect(() => {
    const reload = () => load(false);
    const unsubscribe = [settings.subscribe(reload), clock.subscribe(reload)];
    return () => {
      unsubscribe.forEach((stop) => stop());
      cancelPending.current();
    };
  }, [load, settings, clock]);

  const endsAt = state.status === 'live' ? trackEnd(state.snapshot.playing) : undefined;
  useEffect(() => {
    if (endsAt === undefined) return;
    const timer = setTimeout(() => load(true), Math.max(0, endsAt - clock.now().getTime()));
    return () => clearTimeout(timer);
  }, [endsAt, load, clock]);

  return { state, retry: () => load(false) };
}

function trackEnd({ track, startedAt }: NowPlaying): number | undefined {
  return track.durationSec === undefined
    ? undefined
    : startedAt.getTime() + track.durationSec * 1000;
}
