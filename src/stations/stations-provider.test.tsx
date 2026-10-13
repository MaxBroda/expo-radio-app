import { renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { createStubStations } from './stations';
import { StationsProvider, useStations } from './stations-provider';

test('provides the injected stations', async () => {
  const stations = createStubStations();
  const { result } = await renderHook(() => useStations(), {
    wrapper: ({ children }: PropsWithChildren) => (
      <StationsProvider stations={stations}>{children}</StationsProvider>
    ),
  });

  expect(result.current).toBe(stations);
});

test('throws outside the provider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(renderHook(() => useStations())).rejects.toThrow('StationsProvider');
});
