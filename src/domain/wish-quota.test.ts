import { wishesPerHour, wishQuota } from './wish-quota';

const at = (hours: number, minutes: number) => new Date(2026, 9, 15, hours, minutes);

test('without wishes the full quota is free until the next full hour', () => {
  expect(wishQuota([], at(18, 42))).toEqual({
    limit: wishesPerHour,
    used: 0,
    remaining: 3,
    exhausted: false,
    resetsAt: at(19, 0),
  });
});

test('wishes of the current hour count', () => {
  const quota = wishQuota([at(18, 5), at(18, 30)], at(18, 42));

  expect(quota.used).toBe(2);
  expect(quota.remaining).toBe(1);
});

test('the third wish exhausts the quota', () => {
  const quota = wishQuota([at(18, 5), at(18, 30), at(18, 41)], at(18, 42));

  expect(quota.exhausted).toBe(true);
  expect(quota.remaining).toBe(0);
});

test('the quota resets at the full hour, not 60 minutes after each wish', () => {
  const quota = wishQuota([at(18, 50), at(18, 55), at(18, 59)], at(19, 1));

  expect(quota.used).toBe(0);
  expect(quota.resetsAt).toEqual(at(20, 0));
});

test('the reset carries over midnight', () => {
  expect(wishQuota([], at(23, 30)).resetsAt).toEqual(new Date(2026, 9, 16, 0, 0));
});

test('remaining never drops below zero', () => {
  const sent = [at(18, 1), at(18, 2), at(18, 3), at(18, 4)];

  expect(wishQuota(sent, at(18, 10)).remaining).toBe(0);
});
