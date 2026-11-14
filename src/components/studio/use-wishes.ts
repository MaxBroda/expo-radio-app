import { useEffect, useState } from 'react';

import type { Wish, WishId, WishStatus } from '@/domain/wish';
import { useStations } from '@/stations/stations-provider';

export function useWishes() {
  const { wishSystem } = useStations();
  const [wishes, setWishes] = useState<Wish[]>([]);

  useEffect(() => {
    wishSystem.list().then((list) => setWishes(list));
  }, [wishSystem]);

  function setStatus(id: WishId, status: WishStatus) {
    wishSystem.setStatus(id, status).then((updated) => {
      setWishes((list) => list.map((wish) => (wish.id === updated.id ? updated : wish)));
    });
  }

  return { wishes, setStatus };
}
