import { act, screen, userEvent } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';
import type { PropsWithChildren } from 'react';

import NowPlayingScreen from '@/app/(listener)/index';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { NowPlaying } from '@/domain/now-playing';
import type { TrackId } from '@/domain/track';
import { schedule } from '@/seed/schedule';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { ThemeProvider } from '@/theme';

const now = new Date(2026, 9, 15, 18, 42);
const playing: NowPlaying = {
  track: {
    id: 't_0001' as TrackId,
    title: 'Nordlicht',
    artist: 'Halbmond Kollektiv',
    album: 'Spätsommerkanal',
    year: 2024,
    durationSec: 232,
  },
  startedAt: new Date(now.getTime() - 131_000),
  show: schedule.showAt(now),
};

async function renderNowPlaying(getNowPlaying: () => Promise<NowPlaying>) {
  const clock = new DemoClock(now, () => Date.now());
  const settings = new DemoSettings();
  const stations = createStubStations();
  const fetch = jest.fn(getNowPlaying);
  stations.playout.getNowPlaying = fetch;

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
    {
      _layout: () => <Stack screenOptions={{ headerShown: false }} />,
      index: NowPlayingScreen,
      'rate/track': () => null,
      'rate/show': () => null,
      wish: () => null,
    },
    { initialUrl: '/', wrapper: Providers },
  );
  return { app, fetch, clock, settings };
}

test('shows skeletons and a connecting badge while loading', async () => {
  await renderNowPlaying(() => new Promise(() => {}));

  expect(screen.getByRole('progressbar', { name: 'Titel wird geladen' })).toBeOnTheScreen();
  expect(screen.getByText('verbindet')).toBeOnTheScreen();
  expect(screen.queryByText('Titel bewerten')).not.toBeOnTheScreen();
});

test('shows track, album line, progress and the show on air', async () => {
  await renderNowPlaying(async () => playing);

  expect(await screen.findByText('Nordlicht')).toBeOnTheScreen();
  expect(screen.getByText('Halbmond Kollektiv')).toBeOnTheScreen();
  expect(screen.getByText('Spätsommerkanal · 2024')).toBeOnTheScreen();
  expect(screen.getByText('3:52')).toBeOnTheScreen();
  expect(screen.getByRole('progressbar').props.accessibilityValue).toMatchObject({ max: 232 });
  expect(screen.getByText('Feierabendwelle')).toBeOnTheScreen();
  expect(screen.getByText('Lena Osterkamp · bis 20:00')).toBeOnTheScreen();
  expect(screen.getByLabelText(/^Live, \d\d:\d\d Uhr$/)).toBeOnTheScreen();
});

test('an unmoderated show has no host rating', async () => {
  const night = new Date(2026, 9, 15, 23, 30);
  await renderNowPlaying(async () => ({ ...playing, show: schedule.showAt(night) }));

  expect(await screen.findByText('Ohne Moderation · bis 06:00')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: /^Moderation von/ })).not.toBeOnTheScreen();
});

test('the main action opens the track rating', async () => {
  const user = userEvent.setup();
  const { app } = await renderNowPlaying(async () => playing);

  await user.press(await screen.findByText('Titel bewerten'));
  expect(app.getPathname()).toBe('/rate/track');
});

test('the host rating opens the show rating', async () => {
  const user = userEvent.setup();
  const { app } = await renderNowPlaying(async () => playing);

  await user.press(
    await screen.findByRole('button', { name: 'Moderation von Lena Osterkamp bewerten' }),
  );
  expect(app.getPathname()).toBe('/rate/show');
});

test('offline without a known track explains the state and offers a retry', async () => {
  const user = userEvent.setup();
  const { fetch } = await renderNowPlaying(async () => {
    throw new StationUnavailableError('Playout');
  });

  expect(await screen.findByText('Keine Verbindung zum Sender')).toBeOnTheScreen();
  expect(screen.getByText('OFFLINE')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Bewerten offline nicht möglich' })).toBeDisabled();

  fetch.mockResolvedValueOnce(playing);
  await user.press(screen.getByRole('button', { name: 'Erneut verbinden' }));
  expect(await screen.findByText('Nordlicht')).toBeOnTheScreen();
});

test('losing the connection keeps the last known track with its time', async () => {
  const { fetch, settings } = await renderNowPlaying(async () => playing);
  await screen.findByText('Nordlicht');

  fetch.mockRejectedValue(new StationUnavailableError('Playout'));
  await act(async () => settings.set({ connection: 'offline' }));

  expect(await screen.findByText('Keine Verbindung zum Sender')).toBeOnTheScreen();
  expect(screen.getByText('Nordlicht')).toBeOnTheScreen();
  expect(screen.getByText(/^Stand \d\d:\d\d · Laufzeit unbekannt$/)).toBeOnTheScreen();
  expect(screen.queryByText('Titel bewerten')).not.toBeOnTheScreen();
});

test('a demo jump drops the last known track', async () => {
  const { fetch, clock } = await renderNowPlaying(async () => playing);
  await screen.findByText('Nordlicht');

  fetch.mockRejectedValue(new StationUnavailableError('Playout'));
  await act(async () => clock.jumpTo(new Date(2026, 9, 15, 8, 42)));

  expect(await screen.findByText('Keine Verbindung zum Sender')).toBeOnTheScreen();
  expect(screen.queryByText('Nordlicht')).not.toBeOnTheScreen();
});

test('coming back to the screen keeps the track while it refreshes', async () => {
  const { app, fetch } = await renderNowPlaying(async () => playing);
  await screen.findByText('Nordlicht');

  fetch.mockImplementation(() => new Promise(() => {}));
  await act(async () => router.push('/wish'));
  await act(async () => router.back());

  expect(app.getPathname()).toBe('/');
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(screen.getByText('Nordlicht')).toBeOnTheScreen();
  expect(screen.queryByRole('progressbar', { name: 'Titel wird geladen' })).not.toBeOnTheScreen();
});

test('a demo change shows the loading state again', async () => {
  const { fetch, settings } = await renderNowPlaying(async () => playing);
  await screen.findByText('Nordlicht');

  fetch.mockImplementation(() => new Promise(() => {}));
  await act(async () => settings.set({ connection: 'loading' }));

  expect(screen.getByRole('progressbar', { name: 'Titel wird geladen' })).toBeOnTheScreen();
});
