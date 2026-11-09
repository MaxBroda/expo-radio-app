import { wishesPerHour, wishQuota } from './wish-quota';

const dateAt = (hour: number, minute: number) => new Date(2026, 9, 15, hour, minute);

describe('wishQuota', () => {
  it('keeps the complete quota available until the next hour', () => {
    expect(wishQuota([], dateAt(18, 42))).toEqual({
      limit: wishesPerHour,
      used: 0,
      remaining: 3,
      exhausted: false,
      resetsAt: dateAt(19, 0),
    });
  });

  it('counts submissions made during the current hour', () => {
    const result = wishQuota([dateAt(18, 5), dateAt(18, 30)], dateAt(18, 42));

    expect(result).toMatchObject({ used: 2, remaining: 1, exhausted: false });
  });

  it('marks the quota as exhausted after the third submission', () => {
    const result = wishQuota([dateAt(18, 5), dateAt(18, 30), dateAt(18, 41)], dateAt(18, 42));

    expect(result.remaining).toBe(0);
    expect(result.exhausted).toBe(true);
  });

  it('resets on the next full hour', () => {
    const result = wishQuota([dateAt(18, 50), dateAt(18, 55), dateAt(18, 59)], dateAt(19, 1));

    expect(result.used).toBe(0);
    expect(result.resetsAt).toEqual(dateAt(20, 0));
  });

  it('moves the reset time into the following day at midnight', () => {
    expect(wishQuota([], dateAt(23, 30)).resetsAt).toEqual(new Date(2026, 9, 16, 0, 0));
  });

  it('never reports a negative remaining value', () => {
    const submissions = [dateAt(18, 1), dateAt(18, 2), dateAt(18, 3), dateAt(18, 4)];

    expect(wishQuota(submissions, dateAt(18, 10)).remaining).toBe(0);
  });
});
