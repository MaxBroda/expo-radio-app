import { defaultFlags, DemoSettings } from './demo-settings';

test('changes notify subscribers', () => {
  const settings = new DemoSettings();
  const listener = jest.fn();
  settings.subscribe(listener);

  settings.set({ connection: 'offline' });

  expect(settings.get().connection).toBe('offline');
  expect(listener).toHaveBeenCalledTimes(1);
});

test('reset restores every default', () => {
  const settings = new DemoSettings();
  settings.set({ connection: 'loading', rush: true, quotaExhausted: true });

  settings.reset();

  expect(settings.get()).toEqual(defaultFlags);
});

test('instances do not share state', () => {
  const first = new DemoSettings();
  first.set({ sendFails: true });

  expect(new DemoSettings().get().sendFails).toBe(false);
});
