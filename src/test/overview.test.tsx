import { screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import OverviewScreen from '@/app/(studio)/overview';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import type { Rating, RatingId } from '@/domain/rating';
import type { ShowId } from '@/domain/show';
import type { TrackId } from '@/domain/track';
import type { Wish, WishId, WishStatus } from '@/domain/wish';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { ThemeProvider } from '@/theme';

const now = new Date(2026, 9, 15, 18, 42);
const track = { kind: 'track', trackId: 't_0001' as TrackId } as const;
const show = { kind: 'show', showId: 's_1' as ShowId } as const;

const ratings: Rating[] = [
  { id: 'r_1' as RatingId, score: 4, subject: track, createdAt: new Date(2026, 9, 15, 18, 40) },
  { id: 'r_2' as RatingId, score: 5, subject: show, createdAt: new Date(2026, 9, 15, 18, 35) },
  { id: 'r_3' as RatingId, score: 2, subject: track, createdAt: new Date(2026, 9, 15, 18, 30) },
  // older than 15 minutes: counts for today, but not for the averages
  { id: 'r_4' as RatingId, score: 1, subject: show, createdAt: new Date(2026, 9, 15, 18, 0) },
];

const wishes: Wish[] = [
  {
    id: 'w_1' as WishId,
    song: { kind: 'freeText', description: 'Top song' },
    votes: 20,
    status: 'open',
    createdAt: new Date(2026, 9, 15, 18, 10),
  },
  {
    id: 'w_2' as WishId,
    song: { kind: 'freeText', description: 'Second song' },
    votes: 5,
    status: 'open',
    createdAt: new Date(2026, 9, 15, 18, 20),
  },
  {
    id: 'w_3' as WishId,
    song: { kind: 'freeText', description: 'Already accepted' },
    votes: 30,
    status: 'accepted',
    createdAt: new Date(2026, 9, 15, 18, 5),
  },
];

async function renderOverview() {
  const clock = new DemoClock(now);
  const settings = new DemoSettings();
  const stations = createStubStations();
  stations.feedbackHub.list = jest.fn(async () => ratings);
  stations.wishSystem.list = jest.fn(async () => wishes);
  stations.wishSystem.setStatus = jest.fn(async (id: WishId, status: WishStatus) => {
    const wish = wishes.find((item) => item.id === id)!;
    return { ...wish, status };
  });

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
      index: OverviewScreen,
    },
    { wrapper: Providers },
  );
}

test('key figures show the averages of the last 15 minutes and the counts', async () => {
  await renderOverview();

  expect(await screen.findByText('3,0')).toBeOnTheScreen(); // Ø Titel: (4 + 2) / 2
  expect(screen.getByText('5,0')).toBeOnTheScreen(); // Ø Moderation: only the 5
  expect(await screen.findByText('4')).toBeOnTheScreen(); // ratings today
  expect(screen.getByText('2')).toBeOnTheScreen(); // open wishes
});

test('accepting the top wish shows the next one and lowers the open wishes', async () => {
  const user = userEvent.setup();
  await renderOverview();

  expect(await screen.findByText('„Top song“')).toBeOnTheScreen();
  expect(screen.queryByText('„Already accepted“')).not.toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'übernehmen' }));

  expect(await screen.findByText('„Second song“')).toBeOnTheScreen();
  expect(screen.getByText('1')).toBeOnTheScreen();
});
