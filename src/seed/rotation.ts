import type { PlayedTrack } from '@/domain/track';

import type { CatalogTrack } from './catalog';
import { Random } from './random';
import type { Schedule } from './schedule';

type Played = PlayedTrack & { track: CatalogTrack; endsAt: Date };

const noRepeatWithin = 25;

/**
 * Plays the catalog back-to-back from `epoch`, each track matching the slot it starts in.
 * Same epoch and seed give the same sequence, so history and ratings always line up.
 */
export class Rotation {
  private readonly played: Played[] = [];
  private readonly random: Random;

  constructor(
    private readonly catalog: readonly CatalogTrack[],
    private readonly schedule: Schedule,
    private readonly epoch: Date,
    seed = 7,
  ) {
    this.random = new Random(seed);
  }

  at(date: Date): Played {
    this.playUntil(date);
    for (let i = this.played.length - 1; i >= 0; i--) {
      if (this.played[i].startedAt <= date) return this.played[i];
    }
    throw new RangeError(`${date.toISOString()} is before the rotation starts`);
  }

  /** Newest first, without the track playing at `date`. */
  history(date: Date, limit: number): Played[] {
    const current = this.played.indexOf(this.at(date));
    return this.played.slice(Math.max(0, current - limit), current).reverse();
  }

  private playUntil(date: Date) {
    let last = this.played.at(-1);
    while (!last || last.endsAt <= date) {
      const startedAt = last ? last.endsAt : this.epoch;
      const track = this.next(startedAt);
      last = { track, startedAt, endsAt: new Date(startedAt.getTime() + track.durationSec * 1000) };
      this.played.push(last);
    }
  }

  private next(startedAt: Date): CatalogTrack {
    const slot = this.schedule.slotAt(startedAt).key;
    const pool = this.catalog.filter((t) => t.showProfile.includes(slot));
    const recent = new Set(this.played.slice(-noRepeatWithin).map((p) => p.track.id));
    const fresh = pool.filter((t) => !recent.has(t.id));
    const lastId = this.played.at(-1)?.track.id;
    return this.random.pick(fresh.length > 0 ? fresh : pool.filter((t) => t.id !== lastId));
  }
}
