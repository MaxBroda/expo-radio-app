import type { Rating } from '@/domain/rating';
import { useStations } from '@/stations/stations-provider';
import { useEffect, useState } from 'react';

export function useRatings() {
  const { feedbackHub, notifications } = useStations();

  const [ratings, setRatings] = useState<Rating[]>([]);

  useEffect(() => {
    feedbackHub.list().then(
      (list) => setRatings(list),
      () => {},
    );
  }, [feedbackHub]);

  useEffect(() => {
    return notifications.subscribe((event) => {
      if (event.type === 'rating') setRatings((list) => [event.rating, ...list]);
    });
  }, [notifications]);

  return ratings;
}
