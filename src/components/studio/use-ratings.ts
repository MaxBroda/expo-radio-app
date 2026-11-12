import type { Rating } from '@/domain/rating';
import { useStations } from '@/stations/stations-provider';
import { useEffect, useState } from 'react';

export function useRatings() {
  const { feedbackHub } = useStations();

  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    feedbackHub.list().then((list) => setRatings(list));
  }, [feedbackHub]);

  return ratings;
}
