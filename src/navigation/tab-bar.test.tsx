import { screen, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { renderWithTheme } from '@/test/render';

import { renderTabBar } from './tab-bar';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};

const routes = [
  { key: 'now-key', name: 'index', title: 'Jetzt läuft' },
  { key: 'history-key', name: 'history', title: 'Verlauf' },
];

function setup({ focused = 0, prevented = false } = {}) {
  const emitter = { emit: jest.fn(() => ({ defaultPrevented: prevented })) };
  const navigateToTab = jest.fn();
  const state = { index: focused, routes: routes.map(({ key, name }) => ({ key, name })) };
  const descriptors = Object.fromEntries(
    routes.map(({ key, title }) => [
      key,
      {
        options: {
          title,
          tabBarIcon: ({ focused: active }: { focused: boolean }) => (
            <Text>{active ? `${title} icon active` : `${title} icon`}</Text>
          ),
        },
      },
    ]),
  );
  const TabBar = renderTabBar('listener');

  return {
    emitter,
    navigateToTab,
    render: () =>
      renderWithTheme(
        <SafeAreaProvider initialMetrics={metrics}>
          <TabBar
            state={state}
            descriptors={descriptors}
            emitter={emitter}
            navigateToTab={navigateToTab}
          />
        </SafeAreaProvider>,
      ),
  };
}

test('marks the focused tab as selected and passes focus to its icon', async () => {
  const { render } = setup({ focused: 1 });
  await render();

  expect(screen.getByRole('tab', { name: 'Verlauf' })).toBeSelected();
  expect(screen.getByRole('tab', { name: 'Jetzt läuft' })).not.toBeSelected();
  expect(screen.getByText('Verlauf icon active')).toBeTruthy();
});

test('navigates to a tab that is not focused', async () => {
  const { emitter, navigateToTab, render } = setup();
  await render();

  await userEvent.press(screen.getByRole('tab', { name: 'Verlauf' }));

  expect(emitter.emit).toHaveBeenCalledWith({
    type: 'tabPress',
    target: 'history-key',
    canPreventDefault: true,
  });
  expect(navigateToTab).toHaveBeenCalledWith('history-key');
});

test('does not navigate when the focused tab is pressed again', async () => {
  const { navigateToTab, render } = setup();
  await render();

  await userEvent.press(screen.getByRole('tab', { name: 'Jetzt läuft' }));

  expect(navigateToTab).not.toHaveBeenCalled();
});

test('respects a prevented tab press', async () => {
  const { navigateToTab, render } = setup({ prevented: true });
  await render();

  await userEvent.press(screen.getByRole('tab', { name: 'Verlauf' }));

  expect(navigateToTab).not.toHaveBeenCalled();
});
