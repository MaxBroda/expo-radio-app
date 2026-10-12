import { screen } from '@testing-library/react-native';

import { dark, typography } from '@/theme';
import { renderWithTheme } from '@/test/render';

import { AppText } from './app-text';

test('applies typography variant and tone', async () => {
  await renderWithTheme(
    <AppText variant="mono" tone="muted">
      18:42
    </AppText>,
  );

  expect(screen.getByText('18:42')).toHaveStyle({
    fontFamily: typography.mono.fontFamily,
    fontSize: typography.mono.fontSize,
    color: dark.text.muted,
  });
});

test('defaults to body text in the default color', async () => {
  await renderWithTheme(<AppText>Nordlicht</AppText>);

  expect(screen.getByText('Nordlicht')).toHaveStyle({
    fontFamily: typography.body.fontFamily,
    color: dark.text.default,
  });
});
