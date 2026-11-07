import { useEffect, useState } from 'react';

import { useDemo } from '@/demo/demo-provider';

/** The demo time, refreshed every second for progress bars and clocks. */
export function useTickingNow(): Date {
  const { clock } = useDemo();
  const [now, setNow] = useState(() => clock.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(clock.now()), 1000);
    const unsubscribe = clock.subscribe(() => setNow(clock.now()));
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [clock]);

  return now;
}
