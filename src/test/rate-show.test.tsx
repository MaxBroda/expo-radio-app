import { fireEvent, screen } from '@testing-library/react-native';

import RateShowScreen from '@/app/rate/show';
import type { NowPlaying } from '@/domain/now-playing';
import type { TrackId } from '@/domain/track';
import { schedule } from '@/seed/schedule';
import { createStubStations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';

import { renderWithTheme } from './render';

const startedAt = new Date(2026, 9, 27, 18, 40);
const playing: NowPlaying = {
  track: { id: 'track-1' as TrackId, title: 'Nordlicht', artist: 'Halbmond Kollektiv' },
  startedAt,
  show: schedule.showAt(startedAt),
};

async function renderShow(result: () => Promise<NowPlaying>) {
  const stations = createStubStations();
  stations.playout.getNowPlaying = jest.fn(result);
  await renderWithTheme(
    <StationsProvider stations={stations}>
      <RateShowScreen />
    </StationsProvider>,
  );
}

test('shows a loading state while the current show is pending', async () => {
  await renderShow(() => new Promise(() => {}));

  expect(screen.getByRole('progressbar', { name: 'Sendung wird geladen' })).toBeOnTheScreen();
});

test('shows the current host, show and broadcast time', async () => {
  await renderShow(() => Promise.resolve(playing));

  expect(await screen.findByText('Lena Osterkamp')).toBeOnTheScreen();
  expect(screen.getByText('Feierabendwelle')).toBeOnTheScreen();
  expect(screen.getByText('18:00 – 20:00')).toBeOnTheScreen();
});

test('does not invent a host for an unmoderated show', async () => {
  const night = new Date(2026, 9, 27, 23, 30);
  await renderShow(() => Promise.resolve({ ...playing, show: schedule.showAt(night) }));

  expect(await screen.findByText('Keine Moderation')).toBeOnTheScreen();
  expect(screen.getByText('Nachtschiene')).toBeOnTheScreen();
  expect(screen.getByText('23:00 – 06:00')).toBeOnTheScreen();
  expect(screen.queryByLabelText(/Kommentar/)).not.toBeOnTheScreen();
});

test('shows an error when the current show is unavailable', async () => {
  await renderShow(() => Promise.reject(new Error('unavailable')));

  expect(await screen.findByRole('alert')).toBeOnTheScreen();
  expect(screen.getByText('Sendung gerade nicht verfügbar')).toBeOnTheScreen();
  expect(screen.queryByLabelText(/Kommentar/)).not.toBeOnTheScreen();
});

test('allows an optional comment up to 240 characters', async () => {
  await renderShow(() => Promise.resolve(playing));
  await screen.findByText('Lena Osterkamp');

  const field = screen.getByLabelText(/Kommentar/);
  expect(field).toHaveProp('maxLength', 240);
  expect(screen.getByText('0/240')).toBeOnTheScreen();
  await fireEvent.changeText(field, 'Gute Sendung');
  expect(field).toHaveDisplayValue('Gute Sendung');
  expect(screen.getByText('12/240')).toBeOnTheScreen();
});
