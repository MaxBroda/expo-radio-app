import { createStubStations } from './stations';

test('each call creates independent station instances', () => {
  const first = createStubStations();
  const second = createStubStations();

  expect(first.feedbackHub).not.toBe(second.feedbackHub);
  expect(first.wishSystem).not.toBe(second.wishSystem);
});
