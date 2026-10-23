import type { TrackId } from './track';
import { validateWish, wishLimits } from './wish-validation';

const catalogSong = { kind: 'catalog', trackId: 't_0001' as TrackId } as const;
const freeText = (description: string) => ({ kind: 'freeText', description }) as const;

test('a catalog track without greeting is valid', () => {
  expect(validateWish({ song: catalogSong })).toEqual({ ok: true, input: { song: catalogSong } });
});

test('a wish needs a catalog track or a free text', () => {
  expect(validateWish({ greeting: 'Hallo Studio' })).toEqual({
    ok: false,
    problems: ['songMissing'],
  });
});

test('free text is trimmed and inner whitespace collapsed', () => {
  const result = validateWish({ song: freeText('  das Lied   mit dem\nPfeifen  ') });

  expect(result).toEqual({
    ok: true,
    input: { song: freeText('das Lied mit dem Pfeifen') },
  });
});

test.each([
  ['ab', 'freeTextTooShort'],
  ['   ', 'freeTextTooShort'],
  ['x'.repeat(wishLimits.freeTextMax + 1), 'freeTextTooLong'],
])('free text %j is rejected as %s', (description, problem) => {
  expect(validateWish({ song: freeText(description) })).toEqual({ ok: false, problems: [problem] });
});

test('free text at the limits is accepted', () => {
  expect(validateWish({ song: freeText('abc') }).ok).toBe(true);
  expect(validateWish({ song: freeText('x'.repeat(wishLimits.freeTextMax)) }).ok).toBe(true);
});

test('an empty greeting is dropped', () => {
  expect(validateWish({ song: catalogSong, greeting: '   ' })).toEqual({
    ok: true,
    input: { song: catalogSong },
  });
});

test('the greeting is trimmed and limited', () => {
  const atLimit = 'g'.repeat(wishLimits.greetingMax);

  expect(validateWish({ song: catalogSong, greeting: ` ${atLimit} ` })).toEqual({
    ok: true,
    input: { song: catalogSong, greeting: atLimit },
  });
  expect(validateWish({ song: catalogSong, greeting: `${atLimit}g` })).toEqual({
    ok: false,
    problems: ['greetingTooLong'],
  });
});

test('all problems are reported at once', () => {
  const result = validateWish({
    song: freeText('ab'),
    greeting: 'g'.repeat(wishLimits.greetingMax + 1),
  });

  expect(result).toEqual({ ok: false, problems: ['freeTextTooShort', 'greetingTooLong'] });
});
