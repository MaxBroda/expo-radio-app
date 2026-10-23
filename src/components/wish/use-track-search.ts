import { useEffect, useState } from 'react';

import type { Track } from '@/domain/track';
import { useStations } from '@/stations/stations-provider';

export type TrackSearch =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; tracks: Track[] }
  | { status: 'failed' };

const minQueryLength = 2;
const debounceMs = 250;

type Result = { query: string; tracks: Track[] } | { query: string; failed: true };

/** Waits until typing pauses, and ignores answers that arrive for an older query. */
export function useTrackSearch(query: string): TrackSearch {
  const { musicDatabase } = useStations();
  const [result, setResult] = useState<Result | null>(null);
  const trimmed = query.trim();
  const active = trimmed.length >= minQueryLength;

  useEffect(() => {
    if (!active) return;
    let current = true;
    const timer = setTimeout(() => {
      musicDatabase.search(trimmed).then(
        (tracks) => current && setResult({ query: trimmed, tracks }),
        () => current && setResult({ query: trimmed, failed: true }),
      );
    }, debounceMs);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [active, trimmed, musicDatabase]);

  if (!active) return { status: 'idle' };
  if (!result || result.query !== trimmed) return { status: 'searching' };
  if ('failed' in result) return { status: 'failed' };
  return { status: 'done', tracks: result.tracks };
}
