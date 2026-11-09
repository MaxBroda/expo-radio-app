import type { TrackId } from './track';
import { validateWish, wishLimits, type WishProblem, type WishValidation } from './wish-validation';

const catalogSong = { kind: 'catalog', trackId: 't_0001' as TrackId } as const;
const textSong = (description: string) => ({ kind: 'freeText', description }) as const;

function expectInvalid(result: WishValidation, problems: WishProblem[]) {
  expect(result).toEqual({ ok: false, problems });
}

describe('validateWish', () => {
  it('accepts a catalog song without a greeting', () => {
    expect(validateWish({ song: catalogSong })).toEqual({
      ok: true,
      input: { song: catalogSong },
    });
  });

  it('requires either a catalog song or a text description', () => {
    expectInvalid(validateWish({ greeting: 'Hallo Studio' }), ['songMissing']);
  });

  it('normalizes whitespace in text descriptions', () => {
    expect(validateWish({ song: textSong('  das Lied   mit dem\nPfeifen  ') })).toEqual({
      ok: true,
      input: { song: textSong('das Lied mit dem Pfeifen') },
    });
  });

  it.each([
    ['ab', 'freeTextTooShort'],
    ['   ', 'freeTextTooShort'],
    ['x'.repeat(wishLimits.freeTextMax + 1), 'freeTextTooLong'],
  ] as const)('rejects invalid text %j with %s', (description: string, problem: WishProblem) => {
    expectInvalid(validateWish({ song: textSong(description) }), [problem]);
  });

  it('accepts text exactly at both length boundaries', () => {
    const minimum = validateWish({ song: textSong('abc') });
    const maximum = validateWish({ song: textSong('x'.repeat(wishLimits.freeTextMax)) });

    expect(minimum.ok).toBe(true);
    expect(maximum.ok).toBe(true);
  });

  it('removes an empty greeting', () => {
    expect(validateWish({ song: catalogSong, greeting: '   ' })).toEqual({
      ok: true,
      input: { song: catalogSong },
    });
  });

  it('trims greetings and applies their length limit', () => {
    const allowedGreeting = 'g'.repeat(wishLimits.greetingMax);

    expect(validateWish({ song: catalogSong, greeting: ` ${allowedGreeting} ` })).toEqual({
      ok: true,
      input: { song: catalogSong, greeting: allowedGreeting },
    });

    expectInvalid(validateWish({ song: catalogSong, greeting: `${allowedGreeting}g` }), [
      'greetingTooLong',
    ]);
  });

  it('returns every validation problem in one result', () => {
    expectInvalid(
      validateWish({
        song: textSong('ab'),
        greeting: 'g'.repeat(wishLimits.greetingMax + 1),
      }),
      ['freeTextTooShort', 'greetingTooLong'],
    );
  });
});
