import { screen, userEvent } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { renderRouter } from 'expo-router/testing-library';

import { StubMusicDatabase } from '@/adapters/stub/stub-music-database';
import { StubWishSystem } from '@/adapters/stub/stub-wish-system';
import WishScreen from '@/app/(listener)/wish';
import WishSentScreen from '@/app/wish/sent';
import { DemoClock } from '@/demo/demo-clock';
import { DemoProvider } from '@/demo/demo-provider';
import { DemoSettings, type DemoFlags } from '@/demo/demo-settings';
import { createStubStations, type Stations } from '@/stations/stations';
import { StationsProvider } from '@/stations/stations-provider';
import { ThemeProvider } from '@/theme';

const searchLabel = 'Titel oder Interpret suchen';
const wait = { timeout: 3000 };

async function setup(flags: Partial<DemoFlags> = {}) {
  const clock = new DemoClock(new Date(2026, 9, 15, 18, 42));
  const settings = new DemoSettings();
  settings.set(flags);
  const context = { now: () => clock.now(), flags: () => settings.get() };
  const stations: Stations = {
    ...createStubStations(context),
    musicDatabase: new StubMusicDatabase({
      delayMs: 0,
      connection: () => settings.get().connection,
    }),
    wishSystem: new StubWishSystem({ ...context, delayMs: 0 }),
  };

  function Layout() {
    return (
      <ThemeProvider initialPreference="dark">
        <DemoProvider clock={clock} settings={settings}>
          <StationsProvider stations={stations}>
            <Stack screenOptions={{ headerShown: false }} />
          </StationsProvider>
        </DemoProvider>
      </ThemeProvider>
    );
  }

  // renderRouter attaches its helpers to the pending RNTL render, so awaiting it would drop them.
  const app = renderRouter(
    { _layout: Layout, index: WishScreen, 'wish/sent': WishSentScreen },
    { initialUrl: '/' },
  );
  await app;
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  return { user, getPathname: app.getPathname };
}

const sendButton = () => screen.getByRole('button', { name: 'Wunsch absenden' });

test('starts with the most requested songs, the full quota and a disabled button', async () => {
  await setup();

  expect(await screen.findByText('Landungsbrücken raus', {}, wait)).toBeTruthy();
  expect(screen.getByText('Noch 3 von 3 Wünschen frei · zurückgesetzt 19:00')).toBeTruthy();
  expect(screen.getByText('Wähle oben einen Titel aus.')).toBeTruthy();
  expect(sendButton()).toBeDisabled();
});

test('a catalog hit with greeting reaches the studio', async () => {
  const { user, getPathname } = await setup();
  await screen.findByText('Landungsbrücken raus', {}, wait);

  await user.type(screen.getByLabelText(searchLabel), 'grönemeyer');
  await user.press(await screen.findByText('Mensch', {}, wait));
  await user.type(screen.getByLabelText(/^Gruß an die Moderation/), 'Hallo Studio');

  expect(screen.getByText('Gewählt: Mensch')).toBeTruthy();
  await user.press(sendButton());

  expect(await screen.findByText('Wunsch ist im Studio', {}, wait)).toBeTruthy();
  expect(getPathname()).toBe('/wish/sent');
  expect(await screen.findByText('Gruß: „Hallo Studio“', {}, wait)).toBeTruthy();
  expect(screen.getByText('Noch 2 von 3 Wünschen frei · zurückgesetzt 19:00')).toBeTruthy();
});

test('without a catalog hit the description goes to the studio as free text', async () => {
  const { user } = await setup();
  await screen.findByText('Landungsbrücken raus', {}, wait);

  await user.type(screen.getByLabelText(searchLabel), 'pfeifen am anfang');
  expect(await screen.findByText('Kein Treffer im Katalog', {}, wait)).toBeTruthy();
  await user.press(screen.getByText('„pfeifen am anfang“'));

  expect(screen.getByText('Gewählt: Freitext-Wunsch')).toBeTruthy();
  await user.press(sendButton());

  expect(await screen.findByText('Wunsch ist im Studio', {}, wait)).toBeTruthy();
  expect(await screen.findByText('„pfeifen am anfang“', {}, wait)).toBeTruthy();
});

test('a free text below the minimum length cannot be sent', async () => {
  const { user } = await setup();
  await screen.findByText('Landungsbrücken raus', {}, wait);

  await user.type(screen.getByLabelText(searchLabel), 'xq');
  await user.press(await screen.findByText('„xq“', {}, wait));

  expect(screen.getByText('Beschreib den Song mit mindestens 3 Zeichen.')).toBeTruthy();
  expect(sendButton()).toBeDisabled();
});

test('an exhausted quota pauses search and sending', async () => {
  await setup({ quotaExhausted: true });

  expect(await screen.findByText('Kontingent erschöpft', {}, wait)).toBeTruthy();
  expect(screen.getByPlaceholderText('Suche pausiert bis 19:00')).toBeTruthy();
  expect(screen.getByText('Kontingent erschöpft, ab 19:00 wieder möglich.')).toBeTruthy();
  expect(screen.queryByText('Landungsbrücken raus')).toBeNull();
  expect(sendButton()).toBeDisabled();
});

test('failed sending keeps the choice so the listener can retry', async () => {
  const { user, getPathname } = await setup({ sendFails: true });
  await screen.findByText('Landungsbrücken raus', {}, wait);

  await user.type(screen.getByLabelText(searchLabel), 'grönemeyer');
  await user.press(await screen.findByText('Mensch', {}, wait));
  await user.press(sendButton());

  expect(await screen.findByText('Wunsch nicht gesendet', {}, wait)).toBeTruthy();
  expect(screen.getByText('Gewählt: Mensch')).toBeTruthy();
  expect(getPathname()).toBe('/');
});

test('without connection the screen says so instead of showing an empty list', async () => {
  await setup({ connection: 'offline' });

  expect(await screen.findByText('Keine Verbindung', {}, wait)).toBeTruthy();
  expect(sendButton()).toBeDisabled();
});
