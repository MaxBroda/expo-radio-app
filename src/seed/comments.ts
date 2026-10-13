import type { Score } from '@/domain/rating';

export type Band = 'high' | 'mid' | 'low';

export const bandOf = (score: Score): Band => (score >= 4 ? 'high' : score === 3 ? 'mid' : 'low');

// Critical comments target the programming, never the music: the artists are real.
export const trackComments: Record<Band, readonly string[]> = {
  high: [
    'Genau richtig für den Heimweg',
    'Mehr davon!',
    'Perfekt zum Kochen',
    'Hab extra lauter gemacht',
    'Endlich mal wieder',
    'Passt gerade perfekt',
    'Der rettet mir den Stau',
    'Gänsehaut, danke',
  ],
  mid: [
    'Okay, aber den höre ich ständig',
    'Ganz nett, eher was für später',
    'Gut, aber gerade etwas zu laut',
    'Für die Uhrzeit ein bisschen viel',
  ],
  low: [
    'Lief doch eben erst',
    'Passt nicht in die Sendung',
    'Zu viel Bass für die Uhrzeit',
    'Zu hektisch für die Uhrzeit',
    'Der Übergang war hart',
  ],
};

export const showComments: Record<Band, readonly ((host: string) => string)[]> = {
  high: [
    (host) => `${host} macht das super`,
    () => 'Super Moderation heute',
    () => 'Die Geschichte eben war klasse',
    () => 'Angenehm wenig Gerede',
    (host) => `Grüße an ${host}!`,
  ],
  mid: [() => 'Etwas viel Gerede zwischen den Songs', () => 'Gute Auswahl, Ansagen zu lang'],
  low: [() => 'Die Ansage war mir zu lang', () => 'Zu viel Gequatsche heute'],
};
