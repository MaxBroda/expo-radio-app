import { isRatingCommentValid } from './rating';

test('accepts a rating without a comment', () => {
  expect(isRatingCommentValid()).toBe(true);
});

test.each([0, 239, 240])('accepts a comment with %i characters', (length) => {
  expect(isRatingCommentValid('a'.repeat(length))).toBe(true);
});

test('rejects a comment with 241 characters', () => {
  expect(isRatingCommentValid('a'.repeat(241))).toBe(false);
});
