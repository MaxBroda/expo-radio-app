import { screen } from '@testing-library/react-native';

import { dark } from '@/theme';
import { renderWithTheme } from '@/test/render';

import { StatusBanner } from './status-banner';

test('errors are announced as alert', async () => {
  await renderWithTheme(
    <StatusBanner tone="error" title="Keine Verbindung" text="Letzter Stand 18:40" />,
  );

  const banner = screen.getByRole('alert');
  expect(banner).toHaveProp('accessibilityLiveRegion', 'assertive');
  expect(banner).toHaveStyle({ backgroundColor: dark.critical.surface });
  expect(screen.getByText('Letzter Stand 18:40')).toBeOnTheScreen();
});

test('info is announced politely and not as alert', async () => {
  await renderWithTheme(<StatusBanner tone="info" title="Schon bewertet" />);

  expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  expect(screen.getByText('Schon bewertet')).toBeOnTheScreen();
});

test('success uses the data palette', async () => {
  await renderWithTheme(<StatusBanner tone="success" title="Angekommen" />);

  expect(screen.getByText('Angekommen')).toHaveStyle({ color: dark.data.text });
});
