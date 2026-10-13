import { act, screen, userEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

const appDir = './src/app';

// renderRouter attaches its helpers to the pending RNTL render, so awaiting it would drop them.
async function renderApp() {
  const app = renderRouter(appDir, { initialUrl: '/' });
  await app;
  return { getPathname: app.getPathname };
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

test('components page is reachable from now playing', async () => {
  const user = setupUser();
  const app = await renderApp();

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
