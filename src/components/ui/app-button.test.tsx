import { screen, userEvent } from '@testing-library/react-native';

import { dark } from '@/theme';
import { renderWithTheme } from '@/test/render';

import { AppButton } from './app-button';

test('calls onPress when tapped', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<AppButton label="Playlist bewerten" onPress={onPress} />);

  await userEvent.press(screen.getByRole('button', { name: 'Playlist bewerten' }));

  expect(onPress).toHaveBeenCalledTimes(1);
});

test('ignores taps and reports disabled state when disabled', async () => {
  const onPress = jest.fn();
  await renderWithTheme(<AppButton label="Wunsch absenden" disabled onPress={onPress} />);

  const button = screen.getByRole('button', { name: 'Wunsch absenden' });
  await userEvent.press(button);

  expect(onPress).not.toHaveBeenCalled();
  expect(button).toBeDisabled();
});

test('uses accessibilityLabel over the visible label', async () => {
  await renderWithTheme(
    <AppButton label="bewerten" accessibilityLabel="Moderation bewerten" onPress={() => {}} />,
  );

  expect(screen.getByRole('button', { name: 'Moderation bewerten' })).toBeOnTheScreen();
});

test('primary button uses accent surface and ink text', async () => {
  await renderWithTheme(<AppButton label="Senden" onPress={() => {}} />);

  expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: dark.accent.base });
  expect(screen.getByText('Senden')).toHaveStyle({ color: dark.accent.ink });
});

test('disabled button drops the accent colors', async () => {
  await renderWithTheme(<AppButton label="Senden" disabled onPress={() => {}} />);

  expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: dark.surface.disabled });
  expect(screen.getByText('Senden')).toHaveStyle({ color: dark.text.disabled });
});
