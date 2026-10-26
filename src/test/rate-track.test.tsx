import { screen } from '@testing-library/react-native';

import RateTrackScreen from '@/app/rate/track';
import type { NowPlaying } from '@/domain/now-playing';
import type { TrackId } from '@/domain/track';
import { schedule } from '@/seed/schedule';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';

import { renderWithTheme } from './render';

const startedAt = new Date(2026, 9, 26, 18, 40);
const playing: NowPlaying = {
  track: { id: 'track-1' as TrackId, title: 'Nordlicht', artist: 'Halbmond Kollektiv' },
  startedAt,
  show: schedule.showAt(startedAt),
};

async function renderTrack(result: () => Promise<NowPlaying>) {
  const stations = createStubStations();
  stations.playout.getNowPlaying = jest.fn(result);
  await renderWithTheme(
    <StationsProvider stations={stations}>
      <RateTrackScreen />
    </StationsProvider>,
  );
  return stations;
}

test('shows a loading state while the current track is pending', async () => {
  await renderTrack(() => new Promise(() => {}));

  expect(screen.getByRole('progressbar', { name: 'Titel wird geladen' })).toBeOnTheScreen();
  expect(screen.queryByText('Nordlicht')).not.toBeOnTheScreen();
});

test('shows the track returned by the station with artist and start time', async () => {
  const stations = await renderTrack(() => Promise.resolve(playing));

  expect(await screen.findByText('Nordlicht')).toBeOnTheScreen();
  expect(screen.getByText('Halbmond Kollektiv')).toBeOnTheScreen();
  expect(screen.getByText('läuft seit 18:40')).toBeOnTheScreen();
  expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  expect(stations.playout.getNowPlaying).toHaveBeenCalledTimes(1);
});

test('shows an error when the station cannot provide a track', async () => {
  await renderTrack(() => Promise.reject(new Error('unavailable')));

  expect(await screen.findByRole('alert')).toBeOnTheScreen();
  expect(screen.getByText('Titel gerade nicht verfügbar')).toBeOnTheScreen();
  expect(screen.queryByText('Nordlicht')).not.toBeOnTheScreen();
});
