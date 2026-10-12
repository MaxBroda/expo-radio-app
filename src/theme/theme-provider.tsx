import { createContext, use, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, type Colors } from './colors';

const ThemeContext = createContext<Colors>(dark);

export function ThemeProvider({ children }: PropsWithChildren) {
  const colors = useColorScheme() === 'light' ? light : dark;
  return <ThemeContext value={colors}>{children}</ThemeContext>;
}

export function useTheme(): Colors {
  return use(ThemeContext);
}
