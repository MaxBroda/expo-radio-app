import type { WishedSong, WishInput } from './wish';

export const wishLimits = {
  freeTextMin: 3,
  freeTextMax: 120,
  greetingMax: 160,
} as const;

export type WishDraft = {
  song?: WishedSong;
  greeting?: string;
};

export type WishProblem =
  'songMissing' | 'freeTextTooShort' | 'freeTextTooLong' | 'greetingTooLong';

export type WishValidation =
  { ok: true; input: WishInput } | { ok: false; problems: WishProblem[] };

export type WishRejection = WishProblem | 'quotaExhausted' | 'alreadyRequested';

export class WishRejectedError extends Error {
  readonly reason: WishRejection;

  constructor(reason: WishRejection) {
    super(`Wish rejected: ${reason}`);
    this.name = 'WishRejectedError';
    this.reason = reason;
  }
}

const compactWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim();

function prepareSong(song: WishedSong): WishedSong {
  if (song.kind === 'catalog') {
    return song;
  }

  return {
    kind: 'freeText',
    description: compactWhitespace(song.description),
  };
}

function prepareGreeting(value: string | undefined): string | undefined {
  const greeting = value?.trim();
  return greeting ? greeting : undefined;
}

function collectProblems(
  song: WishedSong | undefined,
  greeting: string | undefined,
): WishProblem[] {
  const problems: WishProblem[] = [];

  if (song === undefined) {
    problems.push('songMissing');
  } else if (song.kind === 'freeText') {
    const length = song.description.length;

    if (length < wishLimits.freeTextMin) {
      problems.push('freeTextTooShort');
    }
    if (length > wishLimits.freeTextMax) {
      problems.push('freeTextTooLong');
    }
  }

  if (greeting !== undefined && greeting.length > wishLimits.greetingMax) {
    problems.push('greetingTooLong');
  }

  return problems;
}

export function validateWish(draft: WishDraft): WishValidation {
  const song = draft.song === undefined ? undefined : prepareSong(draft.song);
  const greeting = prepareGreeting(draft.greeting);
  const problems = collectProblems(song, greeting);

  if (song === undefined || problems.length !== 0) {
    return { ok: false, problems };
  }

  const input: WishInput = greeting === undefined ? { song } : { song, greeting };
  return { ok: true, input };
}
