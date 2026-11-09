import { useEffect, useState } from 'react';

import type { Track } from '@/domain/track';
import { useStations } from '@/stations/stations-provider';

export type TrackSearch =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; tracks: Track[] }
  | { status: 'failed' };

type StoredResult = { query: string; tracks: Track[] } | { query: string; failed: true };

const minimumQueryLength = 2;
const searchDelay = 250;

export function useTrackSearch(query: string): TrackSearch {
  const { musicDatabase } = useStations();
  const [lastResult, setLastResult] = useState<StoredResult | null>(null);
  const normalizedQuery = query.trim();
  const enabled = normalizedQuery.length >= minimumQueryLength;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let acceptsResult = true;
    const timeout = setTimeout(() => {
      musicDatabase.search(normalizedQuery).then(
        (tracks) => {
          if (acceptsResult) {
            setLastResult({ query: normalizedQuery, tracks });
          }
        },
        () => {
          if (acceptsResult) {
            setLastResult({ query: normalizedQuery, failed: true });
          }
        },
      );
    }, searchDelay);

    return () => {
      acceptsResult = false;
      clearTimeout(timeout);
    };
  }, [enabled, musicDatabase, normalizedQuery]);

  if (!enabled) {
    return { status: 'idle' };
  }
  if (lastResult === null || lastResult.query !== normalizedQuery) {
    return { status: 'searching' };
  }
  if ('failed' in lastResult) {
    return { status: 'failed' };
  }

  return { status: 'done', tracks: lastResult.tracks };
}
