import type { DemoClock } from '@/demo/demo-clock';
import type { DemoFlags, DemoListener } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { Wish, WishedSong, WishId, WishInput, WishStatus } from '@/domain/wish';
import { wishQuota, type WishQuota } from '@/domain/wish-quota';
import { validateWish, WishRejectedError } from '@/domain/wish-validation';
import type { WishSystem } from '@/ports/wish-system';
import { catalog } from '@/seed/catalog';
import { seedWishes } from '@/seed/wishes';

import { reachStation } from './reach-station';

type Flags = Pick<DemoFlags, 'connection' | 'sendFails' | 'quotaExhausted'> &
  Partial<Pick<DemoFlags, 'listener'>>;

type Options = {
  now?: () => Date;
  wishes?: readonly Wish[];
  delayMs?: number;
  flags?: () => Flags;
  demoClock?: DemoClock;
};

const defaultFlags: Flags = {
  connection: 'online',
  sendFails: false,
  quotaExhausted: false,
};

function songsEqual(left: WishedSong, right: WishedSong): boolean {
  if (left.kind === 'catalog' && right.kind === 'catalog') {
    return left.trackId === right.trackId;
  }

  if (left.kind !== 'freeText' || right.kind !== 'freeText') {
    return false;
  }

  return left.description.toLocaleLowerCase('de') === right.description.toLocaleLowerCase('de');
}

const copyWish = (wish: Wish): Wish => ({ ...wish });

export class StubWishSystem implements WishSystem {
  private items: Wish[];
  private readonly sentDuringSession = new Map<DemoListener, Date[]>();
  private readonly supportedIds = new Map<DemoListener, Set<WishId>>();
  private readonly demoClock?: DemoClock;
  private revision: number;
  private readonly initialWishes?: readonly Wish[];
  private sequence: number;
  private readonly clock: () => Date;
  private readonly latency: number;
  private readonly readFlags: () => Flags;

  constructor(options: Options = {}) {
    const { now = () => new Date(), wishes, delayMs = 400, flags = () => defaultFlags } = options;

    this.clock = now;
    this.demoClock = options.demoClock;
    this.revision = options.demoClock?.revision ?? 0;
    this.initialWishes = wishes;
    this.latency = delayMs;
    this.readFlags = flags;
    this.items = [...(wishes ?? seedWishes(now(), catalog))];
    this.sequence = this.items.length;
  }

  async submitRequest(input: WishInput): Promise<Wish> {
    const listener = this.readFlags().listener ?? 1;
    const revision = this.demoClock?.revision;
    await this.ensureReachable();
    if (revision !== this.demoClock?.revision) throw new StationUnavailableError('WishSystem');
    this.resetIfNeeded();
    const supported = this.supportedIds.get(listener) ?? new Set<WishId>();
    const sent = this.sentDuringSession.get(listener) ?? [];
    this.supportedIds.set(listener, supported);
    this.sentDuringSession.set(listener, sent);

    if (this.readFlags().sendFails) {
      throw new StationUnavailableError('WishSystem');
    }

    const validation = validateWish(input);
    if (!validation.ok) {
      throw new WishRejectedError(validation.problems[0]);
    }

    const { song, greeting } = validation.input;
    const alreadySupported = this.items.some(
      (wish) => wish.status === 'open' && supported.has(wish.id) && songsEqual(wish.song, song),
    );

    if (alreadySupported) {
      throw new WishRejectedError('alreadyRequested');
    }

    const submittedAt = this.clock();
    if (this.quotaAt(submittedAt, listener).exhausted) {
      throw new WishRejectedError('quotaExhausted');
    }

    sent.push(submittedAt);

    if (song.kind === 'catalog') {
      const existing = this.items.find(
        (wish) =>
          wish.status === 'open' &&
          wish.song.kind === 'catalog' &&
          wish.song.trackId === song.trackId,
      );

      if (existing !== undefined) {
        supported.add(existing.id);
        return this.save({
          ...existing,
          votes: existing.votes + 1,
          greeting: existing.greeting ?? greeting,
        });
      }
    }

    const created = this.createWish(validation.input, submittedAt);
    this.items.unshift(created);
    supported.add(created.id);

    return copyWish(created);
  }

  async list(): Promise<Wish[]> {
    await this.ensureReachable();
    this.resetIfNeeded();

    return this.items
      .slice()
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map(copyWish);
  }

  async setStatus(id: WishId, status: WishStatus): Promise<Wish> {
    await this.ensureReachable();
    this.resetIfNeeded();

    const current = this.items.find((wish) => wish.id === id);
    if (current === undefined) {
      throw new RangeError(`Unknown wish ${id}`);
    }

    return this.save({ ...current, status });
  }

  async quota(): Promise<WishQuota> {
    const listener = this.readFlags().listener ?? 1;
    await this.ensureReachable();
    this.resetIfNeeded();
    return this.quotaAt(this.clock(), listener);
  }

  private resetIfNeeded() {
    if (!this.demoClock || this.revision === this.demoClock.revision) return;
    this.revision = this.demoClock.revision;
    this.items = [...(this.initialWishes ?? seedWishes(this.clock(), catalog))];
    this.sequence = this.items.length;
    this.sentDuringSession.clear();
    this.supportedIds.clear();
  }

  private createWish(input: WishInput, createdAt: Date): Wish {
    this.sequence += 1;

    return {
      ...input,
      id: `w_${String(this.sequence).padStart(2, '0')}` as WishId,
      createdAt,
      votes: 1,
      status: 'open',
    };
  }

  private quotaAt(now: Date, listener: DemoListener): WishQuota {
    const quota = wishQuota(this.sentDuringSession.get(listener) ?? [], now);

    if (!this.readFlags().quotaExhausted) {
      return quota;
    }

    return {
      ...quota,
      used: quota.limit,
      remaining: 0,
      exhausted: true,
    };
  }

  private save(next: Wish): Wish {
    this.items = this.items.map((wish) => (wish.id === next.id ? next : wish));
    return copyWish(next);
  }

  private ensureReachable(): Promise<void> {
    return reachStation('WishSystem', this.latency, () => this.readFlags().connection);
  }
}
