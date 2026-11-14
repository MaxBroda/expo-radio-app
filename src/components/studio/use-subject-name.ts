import { useEffect, useState } from 'react';

import type { RatingSubject } from '@/domain/rating';
import { useStations } from '@/stations/stations-provider';

export function useSubjectName(subject: RatingSubject) {
  const { musicDatabase } = useStations();
  const [trackName, setTrackName] = useState('');

  useEffect(() => {
    if (subject.kind !== 'track') return;
    musicDatabase.lookup(subject.trackId).then((track) => {
      if (track) setTrackName(`${track.title} — ${track.artist}`);
    });
  }, [musicDatabase, subject]);

  // TO-DO: implement station system that offers show & moderator
  return subject.kind === 'track' ? trackName : 'Sendung — Moderator';
}
