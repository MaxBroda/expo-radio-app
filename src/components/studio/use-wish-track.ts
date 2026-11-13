import type { Track } from '@/domain/track';
import type { WishedSong } from '@/domain/wish';
import { useStations } from '@/stations/stations-provider';
import { useEffect, useState } from 'react';

export function useWishTrack(song: WishedSong) {
  const { musicDatabase } = useStations();
  const [track, setTrack] = useState<Track>();

  useEffect(() => {
    if (song.kind !== 'catalog') return;
    musicDatabase.lookup(song.trackId).then(
      (found) => setTrack(found),
      () => {},
    );
  }, [musicDatabase, song]);

  return track;
}
