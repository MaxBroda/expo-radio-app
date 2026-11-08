import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import HistoryScreen from '@/app/(listener)/history';
import RateTrackScreen from '@/app/rate/track';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { NowPlaying } from '@/domain/now-playing';
import type { PlayedTrack, TrackId } from '@/domain/track';
import { schedule } from '@/seed/schedule';
import { RatingProvider } from '@/stations/rating-provider';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { ThemeProvider } from '@/theme';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

const now = new Date(2026, 9, 15, 18, 42);
const onAir: NowPlaying = {
  track: { id: 't_0003' as TrackId, title: 'Nordlicht', artist: 'Halbmond Kollektiv' },
  startedAt: new Date(2026, 9, 15, 18, 41),
  show: schedule.showAt(now),
};
const history: PlayedTrack[] = [
  {
    track: { id: 't_0001' as TrackId, title: 'Taxi um vier', artist: 'Fiona Welk' },
    startedAt: new Date(2026, 9, 15, 18, 38),
  },
  {
    track: { id: 't_0002' as TrackId, title: 'Glasfassaden', artist: 'Rotes Signal' },
    startedAt: new Date(2026, 9, 15, 18, 34),
  },
];

async function renderHistory(getHistory: () => Promise<PlayedTrack[]>) {
  const clock = new DemoClock(now);
  const settings = new DemoSettings();
  const stations = createStubStations();
  const fetch = jest.fn(getHistory);
  stations.playout.getHistory = fetch;
  stations.playout.getNowPlaying = jest.fn(async (): Promise<NowPlaying> => onAir);

  function Providers({ children }: PropsWithChildren) {
    return (
      <ThemeProvider initialPreference="dark">
        <DemoProvider clock={clock} settings={settings}>
          <StationsProvider stations={stations}>
            <RatingProvider clock={clock} feedbackHub={stations.feedbackHub}>
              {children}
            </RatingProvider>
          </StationsProvider>
        </DemoProvider>
      </ThemeProvider>
    );
  }

  const app = await renderRouter(
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      history: HistoryScreen,
      index: () => null,
      'rate/track': RateTrackScreen,
    },
    { initialUrl: '/history', wrapper: Providers },
  );
  return { app, fetch, settings };
}

test('shows skeleton rows while loading', async () => {
  await renderHistory(() => new Promise(() => {}));

  expect(screen.getByRole('progressbar', { name: 'Verlauf wird geladen' })).toBeOnTheScreen();
});

test('lists the played tracks newest first with their start time', async () => {
  await renderHistory(async () => history);

  const rows = await screen.findAllByLabelText(/ Uhr$/);
  expect(rows.map((row) => row.props.accessibilityLabel)).toEqual([
    'Taxi um vier von Fiona Welk, 18:38 Uhr',
    'Glasfassaden von Rotes Signal, 18:34 Uhr',
  ]);
  expect(screen.getByText('Tippen zum Bewerten')).toBeOnTheScreen();
});

test('a rated track shows its score in the list after coming back', async () => {
  const user = userEvent.setup();
  await renderHistory(async () => history);

  await user.press(await screen.findByRole('button', { name: /^Taxi um vier/ }));
  await user.press(await screen.findByRole('radio', { name: '4 von 5 Sternen: gut' }));
  await user.press(screen.getByRole('button', { name: 'Bewertung absenden' }));
  await user.press(await screen.findByRole('button', { name: 'Fertig' }));

  expect(await screen.findByText('Tippen zum Bewerten · 1 bereits bewertet')).toBeOnTheScreen();
  expect(screen.getByText('4/5')).toBeOnTheScreen();
  expect(
    screen.getByRole('button', {
      name: 'Taxi um vier von Fiona Welk, 18:38 Uhr, bewertet mit 4 von 5',
    }),
  ).toBeOnTheScreen();
});

test('tapping a row opens the rating for exactly that track', async () => {
  const user = userEvent.setup();
  await renderHistory(async () => history);

  await user.press(await screen.findByRole('button', { name: /^Glasfassaden/ }));

  expect(screen).toHavePathname('/rate/track');
  expect(await screen.findByText('gelaufen 18:34')).toBeOnTheScreen();
  expect(screen.getByText('Rotes Signal')).toBeOnTheScreen();
});

test('an empty history explains when the day starts and leads to now playing', async () => {
  const user = userEvent.setup();
  const { app } = await renderHistory(async () => []);

  expect(await screen.findByText('Noch nichts gelaufen')).toBeOnTheScreen();
  expect(screen.getByText('Noch keine Titel heute')).toBeOnTheScreen();
  expect(screen.getByText(/beginnt um 06:00 mit „Welle am Morgen“/)).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Zu „Jetzt läuft“' }));
  expect(app.getPathname()).toBe('/');
});

test('a failed request offers a retry', async () => {
  const user = userEvent.setup();
  const { fetch } = await renderHistory(async () => {
    throw new StationUnavailableError('Playout');
  });

  expect(await screen.findByText('Verlauf gerade nicht verfügbar')).toBeOnTheScreen();
  fetch.mockResolvedValueOnce(history);
  await user.press(screen.getByRole('button', { name: 'Erneut versuchen' }));

  expect(await screen.findByText('Taxi um vier')).toBeOnTheScreen();
});

test('reloads when the demo state changes', async () => {
  const { fetch, settings } = await renderHistory(async () => history);
  await screen.findByText('Taxi um vier');

  fetch.mockResolvedValueOnce([]);
  await act(async () => settings.set({ emptyHistory: true }));

  expect(await screen.findByText('Noch nichts gelaufen')).toBeOnTheScreen();
});
