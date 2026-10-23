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

function normalizeSong(song: WishedSong): WishedSong {
  if (song.kind === 'catalog') return song;
  return { kind: 'freeText', description: song.description.replace(/\s+/g, ' ').trim() };
}

/** App and request system both run this, so a wish is checked the same way on either side. */
export function validateWish(draft: WishDraft): WishValidation {
  const problems: WishProblem[] = [];
  const song = draft.song && normalizeSong(draft.song);
  const greeting = draft.greeting?.trim() || undefined;

  if (!song) {
    problems.push('songMissing');
  } else if (song.kind === 'freeText') {
    if (song.description.length < wishLimits.freeTextMin) problems.push('freeTextTooShort');
    if (song.description.length > wishLimits.freeTextMax) problems.push('freeTextTooLong');
  }
  if (greeting && greeting.length > wishLimits.greetingMax) problems.push('greetingTooLong');

  if (!song || problems.length > 0) return { ok: false, problems };
  return { ok: true, input: greeting ? { song, greeting } : { song } };
}
