import { Stack } from 'expo-router';
import { useState } from 'react';

import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';

export default function RootLayout() {
  const [stations] = useState(createStubStations);

  return (
    <StationsProvider stations={stations}>
      <Stack screenOptions={{ headerShown: false }} />
    </StationsProvider>
  );
}
