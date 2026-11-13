import { useEffect, useState } from 'react';

import type { Wish } from '@/domain/wish';
import { useStations } from '@/stations/stations-provider';

export function useWishes() {
  const { wishSystem } = useStations();
  const [wishes, setWishes] = useState<Wish[]>([]);

  useEffect(() => {
    wishSystem.list().then((list) => setWishes(list));
  }, [wishSystem]);

  return wishes;
}
