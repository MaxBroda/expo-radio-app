import { Pill } from '@/components/ui';
import { useDemoFlags } from '@/demo/demo-provider';

export function ActivityPlaceholder() {
  // TO-DO: implement actual calculation of activity Level

  const flags = useDemoFlags();
  const label = flags.rush ? 'Ansturm - 3 neu' : 'Ruhig - 3 in 10 Min';

  return <Pill label={label} />;
}
