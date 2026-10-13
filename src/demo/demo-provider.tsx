import { createContext, use, useSyncExternalStore, type PropsWithChildren } from 'react';

import { schedule } from '@/seed/schedule';

import type { DemoClock } from './demo-clock';
import type { DemoSettings } from './demo-settings';

type Demo = { clock: DemoClock; settings: DemoSettings };

const DemoContext = createContext<Demo | null>(null);

export function DemoProvider({ clock, settings, children }: PropsWithChildren<Demo>) {
  return <DemoContext value={{ clock, settings }}>{children}</DemoContext>;
}

export function useDemo(): Demo {
  const demo = use(DemoContext);
  if (!demo) throw new Error('useDemo must be used inside DemoProvider');
  return demo;
}

export function useDemoFlags() {
  const { settings } = useDemo();
  return useSyncExternalStore(
    (listener) => settings.subscribe(listener),
    () => settings.get(),
  );
}

/** The slot on air, updated when the demo sheet jumps. */
export function useDemoSlot() {
  const { clock } = useDemo();
  return useSyncExternalStore(
    (listener) => clock.subscribe(listener),
    () => schedule.slotAt(clock.now()),
  );
}
