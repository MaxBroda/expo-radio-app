import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import RateShowScreen from '@/app/rate/show';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
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

async function renderShow(result: () => Promise<NowPlaying>, settings = new DemoSettings()) {
  const stations = createStubStations();
  stations.playout.getNowPlaying = jest.fn(result);
  await renderWithTheme(
    <DemoProvider clock={new DemoClock(startedAt)} settings={settings}>
      <StationsProvider stations={stations}>
        <RateShowScreen />
      </StationsProvider>
    </DemoProvider>,
  );
  return settings;
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

test('shows the closed-window demo state and restores the comment when reopened', async () => {
  const settings = await renderShow(() => Promise.resolve(playing));
  await screen.findByText('Lena Osterkamp');
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), 'Gute Sendung');

  await act(() => settings.set({ ratingWindowClosed: true }));

  expect(screen.getByText('Bewertungsfenster geschlossen')).toBeOnTheScreen();
  expect(screen.getByText('Lena Osterkamp')).toBeOnTheScreen();
  expect(screen.queryByLabelText(/Kommentar/)).not.toBeOnTheScreen();
  expect(screen.getAllByRole('button', { name: 'Zurück' })).toHaveLength(2);

  await act(() => settings.set({ ratingWindowClosed: false }));
  expect(screen.queryByText('Bewertungsfenster geschlossen')).not.toBeOnTheScreen();
  expect(screen.getByLabelText(/Kommentar/)).toHaveDisplayValue('Gute Sendung');
});

test('the closed-window back button returns to the previous screen', async () => {
  const back = jest.spyOn(router, 'back').mockImplementation(() => {});
  try {
    const settings = new DemoSettings();
    settings.set({ ratingWindowClosed: true });
    await renderShow(() => Promise.resolve(playing), settings);
    await screen.findByText('Bewertungsfenster geschlossen');

    await userEvent.press(screen.getAllByRole('button', { name: 'Zurück' })[1]);

    expect(back).toHaveBeenCalledTimes(1);
  } finally {
    back.mockRestore();
  }
});
