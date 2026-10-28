import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';

import RateShowScreen from '@/app/rate/show';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings } from '@/demo/demo-settings';
import type { NowPlaying } from '@/domain/now-playing';
import type { Rating, RatingInput } from '@/domain/rating';
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

async function renderShow(
  result: () => Promise<NowPlaying>,
  settings = new DemoSettings(),
  submit?: (input: RatingInput) => Promise<Rating>,
) {
  const stations = createStubStations();
  stations.playout.getNowPlaying = jest.fn(result);
  if (submit) stations.feedbackHub.submitRating = submit;
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

test('sends a show rating, preserves it after an error and shows the returned confirmation', async () => {
  const send = jest.fn(async (input: RatingInput): Promise<Rating> => {
    if (send.mock.calls.length === 1) throw new Error('unavailable');
    return { ...input, id: 'rating-1' as Rating['id'], createdAt: startedAt };
  });
  await renderShow(() => Promise.resolve(playing), new DemoSettings(), send);
  await screen.findByText('Lena Osterkamp');
  expect(screen.getByRole('button', { name: 'Bewertung absenden' })).toBeDisabled();
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), 'Gute Sendung');
  await userEvent.press(screen.getByRole('button', { name: 'Bewertung absenden' }));
  expect(await screen.findByText('Senden fehlgeschlagen')).toBeOnTheScreen();
  expect(screen.getByLabelText(/Kommentar/)).toHaveDisplayValue('Gute Sendung');
  expect(screen.getByText('4 von 5 · gut')).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('button', { name: 'Erneut senden' }));
  expect(await screen.findByText('Danke, ist angekommen')).toBeOnTheScreen();
  expect(screen.getByText('4/5')).toBeOnTheScreen();
  expect(screen.getByText('„Gute Sendung“')).toBeOnTheScreen();
  expect(send).toHaveBeenCalledTimes(2);
  expect(send).toHaveBeenLastCalledWith({
    score: 4,
    comment: 'Gute Sendung',
    subject: { kind: 'show', showId: playing.show.id },
  });
});

test('prevents a second submission while the first is pending', async () => {
  const send = jest.fn(() => new Promise<Rating>(() => {}));
  await renderShow(() => Promise.resolve(playing), new DemoSettings(), send);
  await screen.findByText('Lena Osterkamp');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  await userEvent.press(screen.getByRole('button', { name: 'Bewertung absenden' }));
  expect(screen.getByRole('button', { name: 'Wird gesendet …' })).toBeDisabled();
  expect(send).toHaveBeenCalledTimes(1);
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
  expect(screen.queryByLabelText('Sternebewertung')).not.toBeOnTheScreen();
});

test('shows an error when the current show is unavailable', async () => {
  await renderShow(() => Promise.reject(new Error('unavailable')));

  expect(await screen.findByRole('alert')).toBeOnTheScreen();
  expect(screen.getByText('Sendung gerade nicht verfügbar')).toBeOnTheScreen();
  expect(screen.queryByLabelText(/Kommentar/)).not.toBeOnTheScreen();
});

test('retries loading the show after an error', async () => {
  const load = jest
    .fn<Promise<NowPlaying>, []>()
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValueOnce(playing);
  await renderShow(load);
  await screen.findByText('Sendung gerade nicht verfügbar');

  await userEvent.press(screen.getByRole('button', { name: 'Erneut versuchen' }));

  expect(await screen.findByText('Lena Osterkamp')).toBeOnTheScreen();
  expect(load).toHaveBeenCalledTimes(2);
  expect(screen.queryByText('Sendung gerade nicht verfügbar')).not.toBeOnTheScreen();
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

test('does not submit a comment over 240 characters', async () => {
  const send = jest.fn(() => new Promise<Rating>(() => {}));
  await renderShow(() => Promise.resolve(playing), new DemoSettings(), send);
  await screen.findByText('Lena Osterkamp');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), 'a'.repeat(241));
  const button = screen.getByRole('button', { name: 'Bewertung absenden' });
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(send).not.toHaveBeenCalled();
});

test('allows selecting and changing the moderation rating', async () => {
  await renderShow(() => Promise.resolve(playing));
  await screen.findByText('Lena Osterkamp');
  expect(screen.getByText('Noch nicht bewertet')).toBeOnTheScreen();

  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  expect(screen.getByText('4 von 5 · gut')).toBeOnTheScreen();
  await userEvent.press(screen.getByRole('radio', { name: '2 von 5 Sternen: naja' }));
  expect(screen.getByText('2 von 5 · naja')).toBeOnTheScreen();
});

test('shows the closed-window demo state and restores the comment when reopened', async () => {
  const settings = await renderShow(() => Promise.resolve(playing));
  await screen.findByText('Lena Osterkamp');
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), 'Gute Sendung');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));

  await act(() => settings.set({ ratingWindowClosed: true }));

  expect(screen.getByText('Bewertungsfenster geschlossen')).toBeOnTheScreen();
  expect(screen.getByText('Lena Osterkamp')).toBeOnTheScreen();
  expect(screen.queryByLabelText(/Kommentar/)).not.toBeOnTheScreen();
  expect(screen.queryByLabelText('Sternebewertung')).not.toBeOnTheScreen();
  expect(screen.getAllByRole('button', { name: 'Zurück' })).toHaveLength(2);

  await act(() => settings.set({ ratingWindowClosed: false }));
  expect(screen.queryByText('Bewertungsfenster geschlossen')).not.toBeOnTheScreen();
  expect(screen.getByLabelText(/Kommentar/)).toHaveDisplayValue('Gute Sendung');
  expect(screen.getByText('4 von 5 · gut')).toBeOnTheScreen();
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
