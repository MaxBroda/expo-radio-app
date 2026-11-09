import { act, screen, userEvent } from '@testing-library/react-native';
import { router, Stack } from 'expo-router';
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

const searchFieldLabel = 'Titel oder Interpret suchen';
const asyncOptions = { timeout: 3000 };

async function renderWishFlow(initialFlags: Partial<DemoFlags> = {}) {
  const clock = new DemoClock(new Date(2026, 9, 15, 18, 42));
  const settings = new DemoSettings();
  settings.set(initialFlags);

  const context = {
    now: () => clock.now(),
    flags: () => settings.get(),
  };

  const stations: Stations = {
    ...createStubStations(context),
    musicDatabase: new StubMusicDatabase({
      delayMs: 0,
      connection: () => settings.get().connection,
    }),
    wishSystem: new StubWishSystem({
      ...context,
      delayMs: 0,
    }),
  };

  function TestLayout() {
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

  const application = await renderRouter(
    {
      _layout: TestLayout,
      index: WishScreen,
      'wish/sent': WishSentScreen,
    },
    { initialUrl: '/' },
  );

  return {
    user: userEvent.setup({ advanceTimers: jest.advanceTimersByTime }),
    settings,
    pathname: application.getPathname,
  };
}

const sendButton = () => screen.getByRole('button', { name: 'Wunsch absenden' });
const waitForPopularSongs = () => screen.findByText('Landungsbrücken raus', {}, asyncOptions);

describe('listener wish flow', () => {
  it('shows popular songs, the available quota and a disabled send action initially', async () => {
    await renderWishFlow();

    expect(await waitForPopularSongs()).toBeTruthy();
    expect(screen.getByText('Noch 3 von 3 Wünschen frei · zurückgesetzt 19:00')).toBeTruthy();
    expect(screen.getByText('Wähle oben einen Titel aus.')).toBeTruthy();
    expect(sendButton()).toBeDisabled();
  });

  it('submits a catalog result together with a greeting', async () => {
    const { user, pathname } = await renderWishFlow();
    await waitForPopularSongs();

    await user.type(screen.getByLabelText(searchFieldLabel), 'grönemeyer');
    await user.press(await screen.findByText('Mensch', {}, asyncOptions));
    await user.type(screen.getByLabelText(/^Gruß an die Moderation/), 'Hallo Studio');

    expect(screen.getByText('Gewählt: Mensch')).toBeTruthy();
    await user.press(sendButton());

    expect(await screen.findByText('Wunsch ist im Studio', {}, asyncOptions)).toBeTruthy();
    expect(pathname()).toBe('/wish/sent');
    expect(await screen.findByText('Gruß: „Hallo Studio“', {}, asyncOptions)).toBeTruthy();
    expect(screen.getByText('Noch 2 von 3 Wünschen frei · zurückgesetzt 19:00')).toBeTruthy();
  });

  it('submits the search text when the catalog contains no match', async () => {
    const { user } = await renderWishFlow();
    await waitForPopularSongs();

    await user.type(screen.getByLabelText(searchFieldLabel), 'pfeifen am anfang');
    expect(await screen.findByText('Kein Treffer im Katalog', {}, asyncOptions)).toBeTruthy();
    await user.press(screen.getByText('„pfeifen am anfang“'));

    expect(screen.getByText('Gewählt: Freitext-Wunsch')).toBeTruthy();
    await user.press(sendButton());

    expect(await screen.findByText('Wunsch ist im Studio', {}, asyncOptions)).toBeTruthy();
    expect(await screen.findByText('„pfeifen am anfang“', {}, asyncOptions)).toBeTruthy();
  });

  it('keeps an undersized free-text request from being submitted', async () => {
    const { user } = await renderWishFlow();
    await waitForPopularSongs();

    await user.type(screen.getByLabelText(searchFieldLabel), 'xq');
    await user.press(await screen.findByText('„xq“', {}, asyncOptions));

    expect(screen.getByText('Beschreib den Song mit mindestens 3 Zeichen.')).toBeTruthy();
    expect(sendButton()).toBeDisabled();
  });

  it('disables search and sending while the quota is exhausted', async () => {
    await renderWishFlow({ quotaExhausted: true });

    expect(await screen.findByText('Kontingent erschöpft', {}, asyncOptions)).toBeTruthy();
    expect(screen.getByPlaceholderText('Suche pausiert bis 19:00')).toBeTruthy();
    expect(screen.getByText('Kontingent erschöpft, ab 19:00 wieder möglich.')).toBeTruthy();
    expect(screen.queryByText('Landungsbrücken raus')).toBeNull();
    expect(sendButton()).toBeDisabled();
  });

  it('retains the selected song when submission fails', async () => {
    const { user, pathname } = await renderWishFlow({ sendFails: true });
    await waitForPopularSongs();

    await user.type(screen.getByLabelText(searchFieldLabel), 'grönemeyer');
    await user.press(await screen.findByText('Mensch', {}, asyncOptions));
    await user.press(sendButton());

    expect(await screen.findByText('Wunsch nicht gesendet', {}, asyncOptions)).toBeTruthy();
    expect(screen.getByText('Gewählt: Mensch')).toBeTruthy();
    expect(pathname()).toBe('/');
  });

  it('shows a connection error instead of an empty popular list', async () => {
    await renderWishFlow({ connection: 'offline' });

    expect(await screen.findByText('Keine Verbindung', {}, asyncOptions)).toBeTruthy();
    expect(sendButton()).toBeDisabled();
  });

  it('clears a previous send error when returning with an exhausted quota', async () => {
    const { user, settings } = await renderWishFlow({ sendFails: true });
    await waitForPopularSongs();

    await user.press(screen.getByText('Landungsbrücken raus'));
    await user.press(sendButton());
    expect(await screen.findByText('Wunsch nicht gesendet', {}, asyncOptions)).toBeTruthy();

    settings.set({ sendFails: false, quotaExhausted: true });
    await act(() => router.push('/wish/sent?id=w_01'));
    await act(() => router.back());

    expect(await screen.findByText('Kontingent erschöpft', {}, asyncOptions)).toBeTruthy();
    expect(screen.queryByText('Wunsch nicht gesendet')).toBeNull();
  });

  it('prevents a second vote from the same listener for the same open song', async () => {
    const { user, pathname } = await renderWishFlow();

    await user.press(await waitForPopularSongs());
    await user.press(sendButton());
    expect(await screen.findByText('25', {}, asyncOptions)).toBeTruthy();

    await user.press(screen.getByRole('button', { name: 'Fertig' }));
    await user.press(await waitForPopularSongs());
    await user.press(sendButton());

    expect(
      await screen.findByText(
        'Diesen Titel hast du schon gewünscht. Pro Titel zählt eine Stimme.',
        {},
        asyncOptions,
      ),
    ).toBeTruthy();
    expect(sendButton()).toBeDisabled();
    expect(screen.getByText('Noch 2 von 3 Wünschen frei · zurückgesetzt 19:00')).toBeTruthy();
    expect(pathname()).toBe('/');
  });
});
