import { screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import { renderWithTheme } from '@/test/render';

import { TextField } from './text-field';

function Controlled(props: { maxLength?: number; disabled?: boolean }) {
  const [value, setValue] = useState('');
  return <TextField label="Kommentar" value={value} onChangeText={setValue} {...props} />;
}

test('shows the label and accepts typing', async () => {
  await renderWithTheme(<Controlled />);

  await userEvent.type(screen.getByLabelText('Kommentar'), 'top');

  expect(screen.getByText('Kommentar')).toBeOnTheScreen();
  expect(screen.getByLabelText('Kommentar')).toHaveDisplayValue('top');
});

test('counts characters against maxLength', async () => {
  await renderWithTheme(<Controlled maxLength={240} />);

  expect(screen.getByText('0/240')).toBeOnTheScreen();
  await userEvent.type(screen.getByLabelText('Kommentar'), 'naja');
  expect(screen.getByText('4/240')).toBeOnTheScreen();
});

test('hides the visible label but keeps it accessible', async () => {
  await renderWithTheme(<TextField label="Suche" hideLabel value="" onChangeText={() => {}} />);

  expect(screen.queryByText('Suche')).not.toBeOnTheScreen();
  expect(screen.getByLabelText('Suche')).toBeOnTheScreen();
});

test('is not editable when disabled', async () => {
  await renderWithTheme(<Controlled disabled />);

  expect(screen.getByLabelText('Kommentar')).toHaveProp('editable', false);
});

test('marks optional fields', async () => {
  await renderWithTheme(<TextField label="Gruß" optional value="" onChangeText={() => {}} />);

  expect(screen.getByText(/optional/)).toBeOnTheScreen();
});
