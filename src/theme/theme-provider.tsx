import { createContext, use, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, type Colors } from './colors';

export type ColorSchemePreference = 'system' | 'light' | 'dark';

type ThemeState = {
  colors: Colors;
  scheme: 'light' | 'dark';
  preference: ColorSchemePreference;
  setPreference: (preference: ColorSchemePreference) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const system = useColorScheme();
  const [preference, setPreference] = useState<ColorSchemePreference>('system');
  const scheme = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;

  return (
    <ThemeContext
      value={{ colors: scheme === 'light' ? light : dark, scheme, preference, setPreference }}
    >
      {children}
    </ThemeContext>
  );
}

function useThemeState(): ThemeState {
  const state = use(ThemeContext);
  if (!state) throw new Error('useTheme must be used inside ThemeProvider');
  return state;
}

export function useTheme(): Colors {
  return useThemeState().colors;
}

export function useColorSchemePreference() {
  const { scheme, preference, setPreference } = useThemeState();
  return { scheme, preference, setPreference };
}
