import { demoDay } from '@/demo/demo-clock';
import type { DemoFlags } from '@/demo/demo-settings';
import type { NowPlaying } from '@/domain/now-playing';
import type { PlayedTrack, Track } from '@/domain/track';
import type { Playout } from '@/ports/playout';
import { catalog, type CatalogTrack } from '@/seed/catalog';
import { Rotation } from '@/seed/rotation';
import { schedule as seedSchedule, type Schedule } from '@/seed/schedule';

import { reachStation } from './reach-station';

type Flags = Pick<DemoFlags, 'connection' | 'emptyHistory'>;

type Options = {
  now?: () => Date;
  schedule?: Schedule;
  rotation?: Rotation;
  delayMs?: number;
  flags?: () => Flags;
};

const normalFlags: Flags = { connection: 'online', emptyHistory: false };

function toTrack({ id, title, artist, album, year, durationSec }: CatalogTrack): Track {
  return { id, title, artist, album, year, durationSec };
}

/** Same epoch and seed as the feedback hub, so history and seeded ratings name the same tracks. */
export class StubPlayout implements Playout {
  private readonly now: () => Date;
  private readonly schedule: Schedule;
  private readonly rotation: Rotation;
  private readonly delayMs: number;
  private readonly flags: () => Flags;

  constructor({
    now = () => new Date(),
    schedule = seedSchedule,
    rotation = new Rotation(catalog, schedule, demoDay),
    delayMs = 300,
    flags = () => normalFlags,
  }: Options = {}) {
    this.now = now;
    this.schedule = schedule;
    this.rotation = rotation;
    this.delayMs = delayMs;
    this.flags = flags;
  }

  async getNowPlaying(): Promise<NowPlaying> {
    await this.reach();
    const now = this.now();
    const { track, startedAt } = this.rotation.at(now);
    return { track: toTrack(track), startedAt, show: this.schedule.showAt(now) };
  }

  async getHistory(limit: number): Promise<PlayedTrack[]> {
    await this.reach();
    if (this.flags().emptyHistory) return [];
    return this.rotation
      .history(this.now(), limit)
      .map(({ track, startedAt }) => ({ track: toTrack(track), startedAt }));
  }

  private reach() {
    return reachStation('Playout', this.delayMs, () => this.flags().connection);
  }
}
