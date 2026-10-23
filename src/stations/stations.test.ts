import { defaultFlags } from '@/demo/demo-settings';

import { createStubStations } from './stations';

test('each call creates independent station instances', () => {
  const first = createStubStations();
  const second = createStubStations();

  expect(first.feedbackHub).not.toBe(second.feedbackHub);
  expect(first.wishSystem).not.toBe(second.wishSystem);
});

test('stubs follow the demo clock and the demo states', async () => {
  const stations = createStubStations({
    now: () => new Date(2026, 9, 15, 18, 42),
    flags: () => ({ ...defaultFlags, quotaExhausted: true }),
  });

  expect(await stations.wishSystem.quota()).toMatchObject({
    exhausted: true,
    resetsAt: new Date(2026, 9, 15, 19, 0),
  });
});
