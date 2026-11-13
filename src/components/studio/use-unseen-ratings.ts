import { useStations } from '@/stations/stations-provider';
import { useEffect, useState } from 'react';

export function useUnseenRatings(onTicker: boolean) {
  const { notifications } = useStations();
  const [unseen, setUnseen] = useState(0);

  useEffect(() => {
    return notifications.subscribe((event) => {
      if (event.type === 'rating') setUnseen((count) => count + 1);
    });
  }, [notifications]);

  if (onTicker && unseen !== 0) setUnseen(0);

  return unseen;
}
