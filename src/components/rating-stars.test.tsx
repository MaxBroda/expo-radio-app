import { screen, userEvent } from '@testing-library/react-native';
import { useState } from 'react';

import type { Score } from '@/domain/rating';
import { renderWithTheme } from '@/test/render';

import { RatingStars } from './rating-stars';

function RatingExample() {
  const [score, setScore] = useState<Score>();
  return <RatingStars value={score} onChange={setScore} />;
}

test('starts without a rating', async () => {
  await renderWithTheme(<RatingExample />);

  expect(screen.getByText('Noch nicht bewertet')).toBeOnTheScreen();
  expect(screen.getAllByRole('radio')).toHaveLength(5);
  expect(screen.queryByRole('radio', { checked: true })).toBeNull();
});

test.each([1, 2, 3, 4, 5])('selects %i stars', async (score) => {
  await renderWithTheme(<RatingExample />);

  await userEvent.press(screen.getByRole('radio', { name: new RegExp(`^${score} von 5 Sternen`) }));

  expect(screen.getByRole('radio', { checked: true })).toHaveAccessibleName(
    new RegExp(`^${score} von 5 Sternen`),
  );
  expect(screen.getByText(new RegExp(`^${score} von 5 ·`))).toBeOnTheScreen();
});

test('allows changing a rating from five stars to two', async () => {
  await renderWithTheme(<RatingExample />);

  await userEvent.press(screen.getByRole('radio', { name: '5 von 5 Sternen: top' }));
  await userEvent.press(screen.getByRole('radio', { name: '2 von 5 Sternen: naja' }));

  expect(screen.getByText('2 von 5 · naja')).toBeOnTheScreen();
  expect(screen.getByRole('radio', { name: '2 von 5 Sternen: naja' })).toBeChecked();
  expect(screen.getByRole('radio', { name: '5 von 5 Sternen: top' })).not.toBeChecked();
});
