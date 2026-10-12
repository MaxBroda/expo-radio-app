import { act, renderHook } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { dark, light } from './colors';
import { ThemeProvider, useColorSchemePreference, useTheme } from './theme-provider';

function useBoth() {
  return { colors: useTheme(), ...useColorSchemePreference() };
}

const wrapper = ({ children }: PropsWithChildren) => <ThemeProvider>{children}</ThemeProvider>;

test('follows the system scheme by default', async () => {
  const { result } = await renderHook(useBoth, { wrapper });

  expect(result.current.preference).toBe('system');
});

test('switches colors when a scheme is chosen', async () => {
  const { result } = await renderHook(useBoth, { wrapper });

  await act(() => result.current.setPreference('light'));
  expect(result.current.scheme).toBe('light');
  expect(result.current.colors).toBe(light);

  await act(() => result.current.setPreference('dark'));
  expect(result.current.colors).toBe(dark);
});

test('throws outside the provider', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await expect(renderHook(useTheme)).rejects.toThrow('inside ThemeProvider');
});
