import type { TrackId } from '@/domain/track';
import type { Wish, WishedSong, WishId, WishStatus } from '@/domain/wish';

import type { CatalogTrack } from './catalog';

type Entry = {
  song: { artist: string; title: string } | { freeText: string };
  minutesAgo: number;
  votes: number;
  status: WishStatus;
  greeting?: string;
};

const entries: readonly Entry[] = [
  {
    song: { artist: 'Kettcar', title: 'Landungsbrücken raus' },
    minutesAgo: 34,
    votes: 24,
    status: 'open',
    greeting: 'Für meine Schwester, die heute nach Hamburg zieht',
  },
  { song: { artist: 'Bon Iver', title: 'Holocene' }, minutesAgo: 6, votes: 3, status: 'open' },
  {
    song: { freeText: 'Das Lied aus der Fahrradwerbung mit dem Pfeifen am Anfang' },
    minutesAgo: 12,
    votes: 1,
    status: 'open',
    greeting: 'Schöne Grüße aus der Spätschicht im Klinikum',
  },
  {
    song: { artist: 'Giant Rooks', title: 'Watershed' },
    minutesAgo: 51,
    votes: 17,
    status: 'accepted',
  },
  { song: { artist: 'Wanda', title: 'Bologna' }, minutesAgo: 73, votes: 29, status: 'accepted' },
  {
    song: { artist: 'Phoenix', title: '1901' },
    minutesAgo: 88,
    votes: 9,
    status: 'accepted',
    greeting: 'Danke für die schöne Sendung!',
  },
  {
    song: { artist: 'Faber', title: 'Tausendfrankenlang' },
    minutesAgo: 95,
    votes: 12,
    status: 'accepted',
  },
  {
    song: { artist: 'Daft Punk', title: 'Around the World' },
    minutesAgo: 41,
    votes: 6,
    status: 'rejected',
  },
  {
    song: { freeText: 'Irgendwas Lautes zum Wachwerden' },
    minutesAgo: 120,
    votes: 2,
    status: 'rejected',
  },
  { song: { artist: 'Toto', title: 'Africa' }, minutesAgo: 150, votes: 14, status: 'rejected' },
];

function findTrackId(catalog: readonly CatalogTrack[], artist: string, title: string): TrackId {
  const track = catalog.find((t) => t.title === title && t.artist.startsWith(artist));
  if (!track) throw new RangeError(`Wish refers to unknown track ${artist} – ${title}`);
  return track.id;
}

export function seedWishes(now: Date, catalog: readonly CatalogTrack[]): Wish[] {
  return entries.map((entry, i) => {
    const song: WishedSong =
      'freeText' in entry.song
        ? { kind: 'freeText', description: entry.song.freeText }
        : { kind: 'catalog', trackId: findTrackId(catalog, entry.song.artist, entry.song.title) };
    return {
      id: `w_${String(i + 1).padStart(2, '0')}` as WishId,
      song,
      greeting: entry.greeting,
      createdAt: new Date(now.getTime() - entry.minutesAgo * 60_000),
      votes: entry.votes,
      status: entry.status,
    };
  });
}
