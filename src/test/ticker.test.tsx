import { screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import TickerScreen from '@/app/(studio)/ticker';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import type { Rating, RatingId } from '@/domain/rating';
import type { ShowId } from '@/domain/show';
import type { TrackId } from '@/domain/track';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { ThemeProvider } from '@/theme';

const now = new Date(2026, 9, 15, 18, 42);

const ratings: Rating[] = [
  {
    id: 'r_1' as RatingId,
    score: 5,
    comment: 'Super Moderation',
    subject: { kind: 'show', showId: 's_1' as ShowId },
    createdAt: new Date(2026, 9, 15, 18, 40), // 2 Minuten alt
  },
  {
    id: 'r_2' as RatingId,
    score: 2,
    comment: 'Zu laut',
    subject: { kind: 'track', trackId: 't_0001' as TrackId },
    createdAt: new Date(2026, 9, 15, 18, 30), // 12 Minuten alt
  },
];

async function renderTicker() {
  const clock = new DemoClock(now);
  const settings = new DemoSettings();
  const stations = createStubStations();
  stations.feedbackHub.list = jest.fn(async () => ratings);

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
      index: TickerScreen,
    },
    { wrapper: Providers },
  );
}

test('clicking Moderation shows only show ratings', async () => {
  const user = userEvent.setup();
  await renderTicker();

  expect(await screen.findByText('„Zu laut“')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Moderation 1' }));

  expect(screen.getByText('„Super Moderation“')).toBeOnTheScreen();
  expect(screen.queryByText('„Zu laut“')).not.toBeOnTheScreen();
});

test('only ratings from the last 5 minutes are marked as new', async () => {
  await renderTicker();

  expect(await screen.findByText('„Zu laut“')).toBeOnTheScreen();
  expect(screen.getAllByText('neu')).toHaveLength(1);
});
