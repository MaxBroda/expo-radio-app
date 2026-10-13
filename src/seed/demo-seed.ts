import type { Rating, RatingId, RatingSubject, Score } from '@/domain/rating';
import type { PlayedTrack } from '@/domain/track';
import type { Wish } from '@/domain/wish';

import type { CatalogTrack } from './catalog';
import { showComments, trackComments, type Band } from './comments';
import type { Random } from './random';
import type { Rotation } from './rotation';
import type { Schedule } from './schedule';
import { seedWishes } from './wishes';

export type DemoSeed = {
  /** Newest first. */
  history: PlayedTrack[];
  /** Newest first. */
  ratings: Rating[];
  wishes: Wish[];
};

const minute = 60_000;

/**
 * Rating volume grows towards `now`: the dashboard window (last 15 minutes) holds about 18,
 * the day as a whole about 70. Each phase has one cluster of low scores on a single track,
 * which is what makes the mood curve dip.
 */
const phases = [
  { from: 15, to: 0, count: 18, lowCluster: 2 },
  { from: 40, to: 15, count: 14, lowCluster: 4 },
  { from: 270, to: 40, count: 40, lowCluster: 3 },
];

const bandShare = { high: 0.72, low: 0.03 };
/** Listeners rate the host mostly when they like the show, as in the design. */
const showShare: Record<Band, number> = { high: 0.6, mid: 0.1, low: 0 };
const dayStartsAt = 6 * 60;

function scoreIn(band: Band, random: Random): Score {
  if (band === 'high') return random.chance(0.6) ? 5 : 4;
  if (band === 'mid') return 3;
  return random.chance(0.5) ? 2 : 1;
}

function startOfDay(now: Date): Date {
  const start = new Date(now);
  start.setHours(0, dayStartsAt, 0, 0);
  return start;
}

export class DemoRatings {
  private count = 0;

  constructor(
    private readonly rotation: Rotation,
    private readonly schedule: Schedule,
    private readonly random: Random,
  ) {}

  /** One rating as a listener would leave it at `at`, on what was playing or on air then. */
  create(at: Date, band: Band, subjectKind?: RatingSubject['kind']): Rating {
    const score = scoreIn(band, this.random);
    const show = this.schedule.showAt(at);
    const host = show.hostName?.split(' ')[0];
    const kind = subjectKind ?? (host && this.random.chance(showShare[band]) ? 'show' : 'track');
    const withComment = this.random.chance(0.6);

    let subject: RatingSubject;
    let comment: string | undefined;
    if (kind === 'show' && host) {
      subject = { kind: 'show', showId: show.id };
      if (withComment) comment = this.random.pick(showComments[band])(host);
    } else {
      subject = { kind: 'track', trackId: this.rotation.at(at).track.id };
      if (withComment) comment = this.random.pick(trackComments[band]);
    }

    this.count += 1;
    return {
      id: `r_${String(this.count).padStart(4, '0')}` as RatingId,
      score,
      comment,
      subject,
      createdAt: at,
    };
  }

  /** A random rating at `at`, for the rush state. */
  next(at: Date): Rating {
    const roll = this.random.next();
    return this.create(at, roll < 0.65 ? 'high' : roll < 0.9 ? 'mid' : 'low');
  }

  seed(now: Date): Rating[] {
    const earliest = startOfDay(now).getTime();
    const ratings = phases.flatMap((phase) => this.phase(now, earliest, phase));
    return ratings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  private phase(now: Date, earliest: number, p: (typeof phases)[number]): Rating[] {
    const from = Math.max(now.getTime() - p.from * minute, earliest);
    const to = now.getTime() - p.to * minute;
    if (from >= to) return [];

    const share = (to - from) / ((p.from - p.to) * minute);
    const count = Math.round(p.count * share);
    const cluster = Math.min(p.lowCluster, count);
    const rest = count - cluster;
    const high = Math.round(rest * bandShare.high);
    const low = Math.round(rest * bandShare.low);
    const bands: Band[] = this.random.shuffle([
      ...Array<Band>(high).fill('high'),
      ...Array<Band>(low).fill('low'),
      ...Array<Band>(rest - high - low).fill('mid'),
    ]);

    const at = () => new Date(this.random.int(from, to - 1));
    const ratings = bands.map((band) => this.create(at(), band));

    const clusterTrack = this.rotation.at(at());
    const clusterEnd = Math.min(clusterTrack.endsAt.getTime(), to);
    const clusterStart = Math.max(clusterTrack.startedAt.getTime(), from, clusterEnd - 2 * minute);
    for (let i = 0; i < cluster; i++) {
      ratings.push(
        this.create(new Date(this.random.int(clusterStart, clusterEnd - 1)), 'low', 'track'),
      );
    }
    return ratings;
  }
}

type Deps = { rotation: Rotation; ratings: DemoRatings; catalog: readonly CatalogTrack[] };

export function buildDemoSeed(now: Date, { rotation, ratings, catalog }: Deps): DemoSeed {
  return {
    history: rotation.history(now, 20),
    ratings: ratings.seed(now),
    wishes: seedWishes(now, catalog),
  };
}
