import { useStations } from '@/stations/stations-provider';
import { useDemo, useDemoFlags } from '@/demo/demo-provider';
import { useEffect } from 'react';
import { DemoRatings } from '@/seed/demo-seed';
import { Rotation } from '@/seed/rotation';
import { catalog } from '@/seed/catalog';
import { schedule } from '@/seed/schedule';
import { demoDay } from '@/demo/demo-clock';
import { Random } from '@/seed/random';

export function useRushRatings() {
  const { feedbackHub } = useStations();
  const { clock } = useDemo();
  const flags = useDemoFlags();

  useEffect(() => {
    if (!flags.rush) return;

    const generator = new DemoRatings(
      new Rotation(catalog, schedule, demoDay),
      schedule,
      new Random(Date.now()),
    );
    const timer = setInterval(() => {
      const { score, comment, subject } = generator.next(clock.now());
      feedbackHub.submitRating({ score, comment, subject }).catch(() => {});
    }, 5000);

    return () => clearInterval(timer);
  }, [flags.rush, feedbackHub, clock]);
}
