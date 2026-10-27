import { act, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { StubFeedbackHub } from '@/adapters/stub/stub-feedback-hub';
import { StubPlayout } from '@/adapters/stub/stub-playout';
import type { RatingId } from '@/domain/rating';
import { catalog } from '@/seed/catalog';
import { schedule } from '@/seed/schedule';

const appDir = './src/app';

function renderApp() {
  return renderRouter(appDir, { initialUrl: '/' });
}

function setupUser() {
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
}

test('listener starts on now playing with listener tabs', async () => {
  const app = await renderApp();

  expect(app.getPathname()).toBe('/');
  expect(screen.getByText('Verlauf')).toBeTruthy();
  expect(screen.queryByText('Ticker')).toBeNull();
});

test('pressing a tab switches the page', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByRole('tab', { name: 'Verlauf' }));

  expect(app.getPathname()).toBe('/history');
});

test('opens rating as modal from now playing', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByText('Playlist bewerten'));

  expect(app.getPathname()).toBe('/rate/track');
});

test('finishing a submitted track rating returns to now playing', async () => {
  const createdAt = new Date(2026, 9, 27, 18, 43);
  const playout = jest.spyOn(StubPlayout.prototype, 'getNowPlaying').mockResolvedValue({
    track: catalog[0],
    startedAt: createdAt,
    show: schedule.showAt(createdAt),
  });
  const feedback = jest
    .spyOn(StubFeedbackHub.prototype, 'submitRating')
    .mockImplementation(async (input) => ({ ...input, id: 'rating-test' as RatingId, createdAt }));
  try {
    const user = setupUser();
    const app = await renderApp();
    await user.press(screen.getByText('Playlist bewerten'));
    await screen.findByText(catalog[0].title);
    await user.press(screen.getByRole('radio', { name: '4 von 5 Sternen: gut' }));
    await user.press(screen.getByRole('button', { name: 'Bewertung absenden' }));

    expect(await screen.findByText('Danke, ist angekommen')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Fertig' }));

    expect(app.getPathname()).toBe('/');
    expect(feedback).toHaveBeenCalledTimes(1);
  } finally {
    playout.mockRestore();
    feedback.mockRestore();
  }
});

test('choosing moderation in the demo sheet shows the studio', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  await user.press(screen.getByText('Moderation'));

  expect(app.getPathname()).toBe('/overview');
  expect(screen.getByText('Ticker')).toBeTruthy();
  expect(screen.queryByText('Verlauf')).toBeNull();
});

test('choosing listener again returns to now playing', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  await user.press(screen.getByText('Moderation'));
  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  await user.press(screen.getByText('Hörer'));

  expect(app.getPathname()).toBe('/');
  expect(screen.getByText('Verlauf')).toBeTruthy();
});

test('components page is reachable from the demo sheet', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  await user.press(screen.getByText('Components'));

  expect(app.getPathname()).toBe('/components');
});

test('back in a rating modal returns to now playing', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByText('Moderation bewerten'));
  expect(app.getPathname()).toBe('/rate/show');

  await user.press(screen.getByLabelText('Zurück'));
  expect(app.getPathname()).toBe('/');
});

test('choosing the active role only closes the demo sheet', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  expect(app.getPathname()).toBe('/demo');

  await user.press(screen.getByText('Hörer'));
  expect(app.getPathname()).toBe('/');
});

test('tapping beside the demo sheet closes it', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  await user.press(screen.getByLabelText('Demo-Steuerung schließen'));

  expect(app.getPathname()).toBe('/');
});

test('listener routes are closed to moderation', async () => {
  const user = setupUser();
  const app = await renderApp();

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  await user.press(screen.getByText('Moderation'));
  await act(() => router.push('/rate/track'));

  expect(app.getPathname()).not.toBe('/rate/track');
  expect(screen.queryByText('Playlist bewerten')).toBeNull();
});

test('demo states switch on, stay exclusive per connection and reset', async () => {
  const user = setupUser();
  await renderApp();
  const pill = (name: string) => screen.getByRole('button', { name });

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  await user.press(pill('Lädt'));
  await user.press(pill('Keine Verbindung'));

  expect(pill('Lädt')).not.toBeSelected();
  expect(pill('Keine Verbindung')).toBeSelected();
  expect(screen.getByText(/^1 Zustand aktiv/)).toBeTruthy();

  await user.press(pill('Alles zurücksetzen'));
  expect(pill('Keine Verbindung')).not.toBeSelected();
});

test('the demo sheet jumps between shows', async () => {
  const user = setupUser();
  await renderApp();
  const pill = (name: string) => screen.getByRole('button', { name });

  await user.press(screen.getByLabelText('Demo-Steuerung öffnen'));
  expect(pill('18:00 Feierabendwelle')).toBeSelected();

  await user.press(pill('23:00 Nachtschiene'));

  expect(pill('23:00 Nachtschiene')).toBeSelected();
  expect(pill('18:00 Feierabendwelle')).not.toBeSelected();
});
