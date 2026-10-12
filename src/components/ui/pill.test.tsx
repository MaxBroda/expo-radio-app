import { screen, userEvent } from '@testing-library/react-native';

import { dark } from '@/theme';
import { renderWithTheme } from '@/test/render';

import { Pill } from './pill';

test('is a static label without onPress', async () => {
  await renderWithTheme(<Pill label="LIVE 18:42" />);

  expect(screen.getByText('LIVE 18:42')).toBeOnTheScreen();
  expect(screen.queryByRole('button')).not.toBeOnTheScreen();
});

test('is a selectable button with onPress', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<Pill label="Titel 8" active onPress={onPress} />);

  const pill = screen.getByRole('button', { name: 'Titel 8' });
  await userEvent.press(pill);

  expect(onPress).toHaveBeenCalledTimes(1);
  expect(pill).toBeSelected();
});

test('active pill uses accent colors', async () => {
  await renderWithTheme(<Pill label="Alle" active onPress={() => {}} />);

  expect(screen.getByRole('button')).toHaveStyle({
    backgroundColor: dark.accent.surface,
    borderColor: dark.accent.base,
  });
  expect(screen.getByText('Alle')).toHaveStyle({ color: dark.accent.text });
});
