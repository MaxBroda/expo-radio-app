import { screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import WishesScreen from '@/app/(studio)/wishes';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import type { Wish, WishId, WishStatus } from '@/domain/wish';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { ThemeProvider } from '@/theme';

const now = new Date(2026, 9, 15, 18, 42);

const wishes: Wish[] = [
  {
    id: 'w_1' as WishId,
    song: { kind: 'freeText', description: 'Few votes, newest' },
    votes: 5,
    status: 'open',
    createdAt: new Date(2026, 9, 15, 18, 40),
  },
  {
    id: 'w_2' as WishId,
    song: { kind: 'freeText', description: 'Many votes, older' },
    votes: 20,
    status: 'open',
    createdAt: new Date(2026, 9, 15, 18, 10),
  },
];

async function renderWishes() {
  const clock = new DemoClock(now);
  const settings = new DemoSettings();
  const stations = createStubStations();
  stations.wishSystem.list = jest.fn(async () => wishes);
  const setStatus = jest.fn(async (id: WishId, status: WishStatus) => {
    const wish = wishes.find((item) => item.id === id)!;
    return { ...wish, status };
  });
  stations.wishSystem.setStatus = setStatus;

  function Providers({ children }: PropsWithChildren) {
    return (
      <ThemeProvider initialPreference="dark">
        <DemoProvider clock={clock} settings={settings}>
          <StationsProvider stations={stations}>{children}</StationsProvider>
        </DemoProvider>
      </ThemeProvider>
    );
  }

  await renderRouter(
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      index: WishesScreen,
    },
    { wrapper: Providers },
  );
  return { setStatus };
}

function wishOrder() {
  return screen.getAllByText(/votes, /).map((text) => text.props.children);
}

test('sorts by most votes first and by newest after switching', async () => {
  const user = userEvent.setup();
  await renderWishes();

  expect(await screen.findByText('„Many votes, older“')).toBeOnTheScreen();
  expect(wishOrder()).toEqual(['„Many votes, older“', '„Few votes, newest“']);

  await user.press(screen.getByRole('button', { name: 'neu' }));

  expect(wishOrder()).toEqual(['„Few votes, newest“', '„Many votes, older“']);
});

test('accepting a wish changes its status and hides its buttons', async () => {
  const user = userEvent.setup();
  const { setStatus } = await renderWishes();

  expect(await screen.findAllByRole('button', { name: 'übernehmen' })).toHaveLength(2);

  await user.press(screen.getAllByRole('button', { name: 'übernehmen' })[0]);

  expect(setStatus).toHaveBeenCalledWith('w_2', 'accepted');
  expect(await screen.findAllByRole('button', { name: 'übernehmen' })).toHaveLength(1);
});
