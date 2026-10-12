import { screen } from '@testing-library/react-native';

import { dark } from '@/theme';
import { renderWithTheme } from '@/test/render';

import { Card } from './card';

test.each(['default', 'sunken', 'raised'] as const)('%s card uses its surface', async (tone) => {
  await renderWithTheme(<Card tone={tone} testID="card" />);

  expect(screen.getByTestId('card')).toHaveStyle({
    backgroundColor: dark.surface[tone],
    borderColor: dark.line.default,
  });
});
