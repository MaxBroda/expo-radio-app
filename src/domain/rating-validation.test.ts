import { schedule } from '@/seed/schedule';

import { isShowRatingOpen } from './rating-validation';

test('a show can be rated from the start until just before the end', () => {
  const show = schedule.showAt(new Date(2026, 9, 28, 18, 30));

  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 17, 59, 59))).toBe(false);
  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 18, 0))).toBe(true);
  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 19, 59, 59))).toBe(true);
  expect(isShowRatingOpen(show, new Date(2026, 9, 28, 20, 0))).toBe(false);
});

test('a show crossing midnight uses the actual dates', () => {
  const show = schedule.showAt(new Date(2026, 9, 28, 23, 30));

  expect(isShowRatingOpen(show, new Date(2026, 9, 29, 0, 30))).toBe(true);
  expect(isShowRatingOpen(show, new Date(2026, 9, 29, 6, 0))).toBe(false);
});
