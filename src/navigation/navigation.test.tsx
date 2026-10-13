import { screen, userEvent } from '@testing-library/react-native';
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
