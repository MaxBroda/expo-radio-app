import type { Track } from '@/domain/track';
import type { WishQuota } from '@/domain/wish-quota';
import { wishLimits, type WishProblem } from '@/domain/wish-validation';

export function clockTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function trackLine(track: Track, votes?: number): string {
  const parts = [track.artist, track.album, track.year?.toString()];
  if (votes !== undefined) parts.push(votesLabel(votes));
  return parts.filter(Boolean).join(' · ');
}

export function votesLabel(votes: number): string {
  return votes === 1 ? '1 Stimme' : `${votes} Stimmen`;
}

export function quotaLine(quota: WishQuota): string {
  const free = quota.exhausted
    ? `0 von ${quota.limit} Wünschen frei`
    : `Noch ${quota.remaining} von ${quota.limit} Wünschen frei`;
  return `${free} · zurückgesetzt ${clockTime(quota.resetsAt)}`;
}

export const problemText: Record<WishProblem, string> = {
  songMissing: 'Wähle oben einen Titel aus.',
  freeTextTooShort: `Beschreib den Song mit mindestens ${wishLimits.freeTextMin} Zeichen.`,
  freeTextTooLong: `Die Beschreibung darf höchstens ${wishLimits.freeTextMax} Zeichen lang sein.`,
  greetingTooLong: `Der Gruß darf höchstens ${wishLimits.greetingMax} Zeichen lang sein.`,
};
