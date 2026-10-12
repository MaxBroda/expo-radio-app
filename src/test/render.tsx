import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { ThemeProvider } from '@/theme';

export function renderWithTheme(element: ReactElement) {
  return render(<ThemeProvider initialPreference="dark">{element}</ThemeProvider>);
}
