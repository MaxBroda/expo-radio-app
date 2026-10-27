import { act, fireEvent, screen, userEvent } from '@testing-library/react-native';

import RateTrackScreen from '@/app/rate/track';
import { AlreadyRatedError } from '@/domain/errors';
import type { NowPlaying } from '@/domain/now-playing';
import type { Rating, RatingId, RatingInput } from '@/domain/rating';
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

function savedRating(input: RatingInput): Rating {
  return { ...input, id: 'rating-1' as RatingId, createdAt: startedAt };
}

async function renderTrack(result: () => Promise<NowPlaying>) {
  const stations = createStubStations();
  stations.playout.getNowPlaying = jest.fn(result);
  stations.feedbackHub.submitRating = jest.fn(async (input) => savedRating(input));
  await renderWithTheme(
    <StationsProvider stations={stations}>
      <RateTrackScreen />
    </StationsProvider>,
  );
  return stations;
}

test('shows a loading state while the current track is pending', async () => {
  const stations = await renderTrack(() => new Promise(() => {}));

  expect(screen.getByRole('progressbar', { name: 'Titel wird geladen' })).toBeOnTheScreen();
  expect(screen.queryByText('Nordlicht')).not.toBeOnTheScreen();
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  expect(screen.getByRole('button', { name: 'Bewertung absenden' })).toBeDisabled();
  expect(stations.feedbackHub.submitRating).not.toHaveBeenCalled();
});

test('shows the track returned by the station with artist and start time', async () => {
  const stations = await renderTrack(() => Promise.resolve(playing));

  expect(await screen.findByText('Nordlicht')).toBeOnTheScreen();
  expect(screen.getByText('Halbmond Kollektiv')).toBeOnTheScreen();
  expect(screen.getByText('läuft seit 18:40')).toBeOnTheScreen();
  expect(screen.queryByRole('progressbar')).not.toBeOnTheScreen();
  expect(stations.playout.getNowPlaying).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Bewertung absenden' })).toBeDisabled();
});

test('shows an error when the station cannot provide a track', async () => {
  await renderTrack(() => Promise.reject(new Error('unavailable')));

  expect(await screen.findByRole('alert')).toBeOnTheScreen();
  expect(screen.getByText('Titel gerade nicht verfügbar')).toBeOnTheScreen();
  expect(screen.queryByText('Nordlicht')).not.toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Bewertung absenden' })).toBeDisabled();
});

test.each(['', 'Guter Mix'])('sends the selected track rating with comment %p', async (comment) => {
  const stations = await renderTrack(() => Promise.resolve(playing));
  await screen.findByText('Nordlicht');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), comment);

  await userEvent.press(screen.getByRole('button', { name: 'Bewertung absenden' }));

  expect(stations.feedbackHub.submitRating).toHaveBeenCalledWith({
    score: 4,
    subject: { kind: 'track', trackId: playing.track.id },
    comment: comment || undefined,
  });
  expect(await screen.findByText('Danke, ist angekommen')).toBeOnTheScreen();
  expect(screen.getByText('4/5')).toBeOnTheScreen();
  expect(screen.getByText('Nordlicht — Halbmond Kollektiv')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Fertig' })).toBeEnabled();
  expect(screen.queryByRole('button', { name: 'Bewertung absenden' })).not.toBeOnTheScreen();
  expect(screen.queryByLabelText(/Kommentar/)).not.toBeOnTheScreen();
  if (comment) expect(screen.getByText(`„${comment}“`)).toBeOnTheScreen();
});

test('locks the form and prevents duplicate requests while sending', async () => {
  const stations = await renderTrack(() => Promise.resolve(playing));
  let finish!: () => void;
  jest.mocked(stations.feedbackHub.submitRating).mockImplementationOnce(
    (input) =>
      new Promise((resolve) => {
        finish = () => resolve(savedRating(input));
      }),
  );
  await screen.findByText('Nordlicht');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  const button = screen.getByRole('button', { name: 'Bewertung absenden' });

  await fireEvent.press(button);
  await fireEvent.press(button);

  expect(stations.feedbackHub.submitRating).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Wird gesendet …' })).toBeDisabled();
  expect(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' })).toBeDisabled();
  expect(screen.getByLabelText(/Kommentar/)).toHaveProp('editable', false);
  await act(async () => finish());
  expect(await screen.findByText('Danke, ist angekommen')).toBeOnTheScreen();
});

test('keeps the rating after a failed send and allows retrying', async () => {
  const stations = await renderTrack(() => Promise.resolve(playing));
  jest.mocked(stations.feedbackHub.submitRating).mockRejectedValueOnce(new Error('offline'));
  await screen.findByText('Nordlicht');
  await userEvent.press(screen.getByRole('radio', { name: '2 von 5 Sternen: naja' }));
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), 'Zu langsam');

  await userEvent.press(screen.getByRole('button', { name: 'Bewertung absenden' }));

  expect(await screen.findByText('Senden fehlgeschlagen')).toBeOnTheScreen();
  expect(screen.getByText('2 von 5 · naja')).toBeOnTheScreen();
  expect(screen.getByLabelText(/Kommentar/)).toHaveDisplayValue('Zu langsam');
  expect(screen.getByRole('button', { name: 'Erneut senden' })).toBeEnabled();
  await userEvent.press(screen.getByRole('button', { name: 'Erneut senden' }));
  expect(await screen.findByText('Danke, ist angekommen')).toBeOnTheScreen();
  expect(screen.queryByText('Senden fehlgeschlagen')).not.toBeOnTheScreen();
  expect(stations.feedbackHub.submitRating).toHaveBeenCalledTimes(2);
});

test('does not submit a comment over the limit even if passed programmatically', async () => {
  const stations = await renderTrack(() => Promise.resolve(playing));
  await screen.findByText('Nordlicht');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), 'a'.repeat(241));

  const button = screen.getByRole('button', { name: 'Bewertung absenden' });
  expect(button).toBeDisabled();
  await userEvent.press(button);
  expect(stations.feedbackHub.submitRating).not.toHaveBeenCalled();
});

test('shows an already rated notice instead of offering another send', async () => {
  const stations = await renderTrack(() => Promise.resolve(playing));
  jest.mocked(stations.feedbackHub.submitRating).mockRejectedValueOnce(new AlreadyRatedError());
  await screen.findByText('Nordlicht');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));

  await userEvent.press(screen.getByRole('button', { name: 'Bewertung absenden' }));

  expect(await screen.findByText('Schon bewertet')).toBeOnTheScreen();
  expect(screen.getByText('Nordlicht')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Bewertung absenden' })).not.toBeOnTheScreen();
  expect(screen.queryByRole('radiogroup')).not.toBeOnTheScreen();
  expect(screen.queryByLabelText(/Kommentar/)).not.toBeOnTheScreen();
  expect(screen.queryByText('Senden fehlgeschlagen')).not.toBeOnTheScreen();
  expect(stations.feedbackHub.submitRating).toHaveBeenCalledTimes(1);
});

test('shows the saved rating returned by the hub in the confirmation', async () => {
  const stations = await renderTrack(() => Promise.resolve(playing));
  jest.mocked(stations.feedbackHub.submitRating).mockResolvedValueOnce({
    ...savedRating({ score: 3, subject: { kind: 'track', trackId: playing.track.id } }),
    comment: 'Guter Mix',
    createdAt: new Date(2026, 9, 26, 18, 43),
  });
  await screen.findByText('Nordlicht');
  await userEvent.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
  await fireEvent.changeText(screen.getByLabelText(/Kommentar/), ' Guter Mix ');

  await userEvent.press(screen.getByRole('button', { name: 'Bewertung absenden' }));

  expect(await screen.findByText('Danke, ist angekommen')).toBeOnTheScreen();
  expect(screen.getByText('3/5')).toBeOnTheScreen();
  expect(screen.getByText('„Guter Mix“')).toBeOnTheScreen();
  expect(screen.getByText('18:43')).toBeOnTheScreen();
  expect(screen.queryByRole('radiogroup')).not.toBeOnTheScreen();
  expect(screen.queryByText('4/5')).not.toBeOnTheScreen();
});
