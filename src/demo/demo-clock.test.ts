import { schedule } from '@/seed/schedule';

import { DemoClock, demoMoment } from './demo-clock';

function fakeRealTime() {
  let now = 1_000_000;
  return { realNow: () => now, advance: (ms: number) => (now += ms) };
}

test('starts at the demo time and runs in real time', () => {
  const time = fakeRealTime();
  const clock = new DemoClock(new Date(2026, 9, 15, 18, 42), time.realNow);

  time.advance(90_000);

  expect(clock.now()).toEqual(new Date(2026, 9, 15, 18, 43, 30));
});

test('a jump moves the clock and keeps it running', () => {
  const time = fakeRealTime();
  const clock = new DemoClock(new Date(2026, 9, 15, 18, 42), time.realNow);
  const listener = jest.fn();
  clock.subscribe(listener);

  clock.jumpTo(new Date(2026, 9, 15, 23, 42));
  time.advance(60_000);

  expect(listener).toHaveBeenCalledTimes(1);
  expect(clock.now()).toEqual(new Date(2026, 9, 15, 23, 43));
});

test('each slot has a demo moment inside it', () => {
  for (const slot of schedule.all) {
    expect(schedule.slotAt(demoMoment(slot)).key).toBe(slot.key);
  }
});
