import { schedule } from './schedule';

const thursday = (h: number, m = 0) => new Date(2026, 9, 15, h, m);

test('the slot changes exactly at the hour', () => {
  expect(schedule.slotAt(thursday(17, 59)).key).toBe('nachmittag');
  expect(schedule.slotAt(thursday(18, 0)).key).toBe('feierabend');
});

test('the show carries host and broadcast times', () => {
  const show = schedule.showAt(thursday(18, 42));

  expect(show.title).toBe('Feierabendwelle');
  expect(show.hostName).toBe('Lena Osterkamp');
  expect(show.startsAt).toEqual(thursday(18));
  expect(show.endsAt).toEqual(thursday(20));
});

test('the night slot has no host and runs past midnight', () => {
  const late = schedule.showAt(thursday(23, 30));
  const early = schedule.showAt(new Date(2026, 9, 16, 5, 30));

  expect(late.hostName).toBeUndefined();
  expect(early.id).toBe(late.id);
  expect(early.startsAt).toEqual(thursday(23));
  expect(early.endsAt).toEqual(new Date(2026, 9, 16, 6, 0));
});

test('the same show on another day is a different broadcast', () => {
  const thursdayShow = schedule.showAt(thursday(18, 42));
  const fridayShow = schedule.showAt(new Date(2026, 9, 16, 18, 42));

  expect(fridayShow.id).not.toBe(thursdayShow.id);
});
