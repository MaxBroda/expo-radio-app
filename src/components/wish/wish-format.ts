import type { Track } from '@/domain/track';
import type { WishQuota } from '@/domain/wish-quota';
import { wishLimits, type WishProblem } from '@/domain/wish-validation';

export function clockTime(date: Date): string {
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${hour}:${minute}`;
}

export function votesLabel(votes: number): string {
  return votes === 1 ? '1 Stimme' : `${votes} Stimmen`;
}

export function trackLine(track: Track, votes?: number): string {
  const values: (string | undefined)[] = [track.artist, track.album, track.year?.toString()];

  if (votes !== undefined) {
    values.push(votesLabel(votes));
  }

  return values.filter(Boolean).join(' · ');
}

export function quotaLine(quota: WishQuota): string {
  const availability = quota.exhausted
    ? `0 von ${quota.limit} Wünschen frei`
    : `Noch ${quota.remaining} von ${quota.limit} Wünschen frei`;

  return `${availability} · zurückgesetzt ${clockTime(quota.resetsAt)}`;
}

export const problemText: Record<WishProblem, string> = {
  songMissing: 'Wähle oben einen Titel aus.',
  freeTextTooShort: `Beschreib den Song mit mindestens ${wishLimits.freeTextMin} Zeichen.`,
  freeTextTooLong: `Die Beschreibung darf höchstens ${wishLimits.freeTextMax} Zeichen lang sein.`,
  greetingTooLong: `Der Gruß darf höchstens ${wishLimits.greetingMax} Zeichen lang sein.`,
};

export const alreadyRequestedText =
  'Diesen Titel hast du schon gewünscht. Pro Titel zählt eine Stimme.';
