import { createContext, use, type PropsWithChildren } from 'react';

import type { Stations } from './stations';

const StationsContext = createContext<Stations | null>(null);

export function StationsProvider({
  stations,
  children,
}: PropsWithChildren<{ stations: Stations }>) {
  return <StationsContext value={stations}>{children}</StationsContext>;
}

export function useStations(): Stations {
  const stations = use(StationsContext);
  if (!stations) {
    throw new Error('useStations must be used inside StationsProvider');
  }
  return stations;
}
