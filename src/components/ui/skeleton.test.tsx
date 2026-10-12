import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/test/render';

import { Skeleton } from './skeleton';

test('is hidden from screen readers', async () => {
  await renderWithTheme(<Skeleton width={48} height={48} />);

  expect(screen.toJSON()).toMatchObject({
    props: { importantForAccessibility: 'no-hide-descendants', accessibilityElementsHidden: true },
  });
});
