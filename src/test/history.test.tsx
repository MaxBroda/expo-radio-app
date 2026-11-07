import { act, screen, userEvent } from '@testing-library/react-native';
import { renderRouter } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import HistoryScreen from '@/app/(listener)/history';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { PlayedTrack, TrackId } from '@/domain/track';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { ThemeProvider } from '@/theme';

const now = new Date(2026, 9, 15, 18, 42);
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

  function Providers({ children }: PropsWithChildren) {
    return (
      <ThemeProvider initialPreference="dark">
        <DemoProvider clock={clock} settings={settings}>
          <StationsProvider stations={stations}>{children}</StationsProvider>
        </DemoProvider>
      </ThemeProvider>
    );
  }

  const app = await renderRouter(
    { history: HistoryScreen, index: () => null },
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
