import type { DemoFlags } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { Wish, WishedSong, WishId, WishInput, WishStatus } from '@/domain/wish';
import { wishQuota, type WishQuota } from '@/domain/wish-quota';
import { validateWish, WishRejectedError } from '@/domain/wish-validation';
import type { WishSystem } from '@/ports/wish-system';
import { catalog } from '@/seed/catalog';
import { seedWishes } from '@/seed/wishes';

type Flags = Pick<DemoFlags, 'connection' | 'sendFails' | 'quotaExhausted'>;

type Options = {
  now?: () => Date;
  wishes?: readonly Wish[];
  delayMs?: number;
  flags?: () => Flags;
};

const normalFlags: Flags = { connection: 'online', sendFails: false, quotaExhausted: false };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function sameSong(a: WishedSong, b: WishedSong): boolean {
  if (a.kind === 'catalog' || b.kind === 'catalog') {
    return a.kind === 'catalog' && b.kind === 'catalog' && a.trackId === b.trackId;
  }
  return a.description.toLocaleLowerCase('de') === b.description.toLocaleLowerCase('de');
}

/**
 * Runs on the device, so it only ever sees this device's requests and can count the quota and
 * its own votes without a device id. A real request system would need one.
 */
export class StubWishSystem implements WishSystem {
  private wishes: Wish[];
  private readonly sentAt: Date[] = [];
  /** Wishes this device has already requested or voted for. */
  private readonly supported = new Set<WishId>();
  private created: number;
  private readonly now: () => Date;
  private readonly delayMs: number;
  private readonly flags: () => Flags;

  constructor({
    now = () => new Date(),
    wishes,
    delayMs = 400,
    flags = () => normalFlags,
  }: Options = {}) {
    this.now = now;
    this.delayMs = delayMs;
    this.flags = flags;
    this.wishes = [...(wishes ?? seedWishes(now(), catalog))];
    this.created = this.wishes.length;
  }

  async submitRequest(input: WishInput): Promise<Wish> {
    await this.reach();
    if (this.flags().sendFails) throw new StationUnavailableError('WishSystem');

    const result = validateWish(input);
    if (!result.ok) throw new WishRejectedError(result.problems[0]);

    const { song, greeting } = result.input;
    const own = this.wishes.find(
      (w) => w.status === 'open' && this.supported.has(w.id) && sameSong(w.song, song),
    );
    // One vote per device and song, otherwise one listener could push a song with the quota.
    if (own) throw new WishRejectedError('alreadyRequested');

    const now = this.now();
    if (this.currentQuota(now).exhausted) throw new WishRejectedError('quotaExhausted');
    this.sentAt.push(now);

    const trackId = song.kind === 'catalog' ? song.trackId : undefined;
    const open = this.wishes.find(
      (w) => w.status === 'open' && w.song.kind === 'catalog' && w.song.trackId === trackId,
    );

    // An open wish for the same track gets a vote instead, so the studio sees no duplicates.
    if (open) {
      this.supported.add(open.id);
      return this.replace({ ...open, votes: open.votes + 1, greeting: open.greeting ?? greeting });
    }

    this.created += 1;
    const wish: Wish = {
      ...result.input,
      id: `w_${String(this.created).padStart(2, '0')}` as WishId,
      createdAt: now,
      votes: 1,
      status: 'open',
    };
    this.wishes = [wish, ...this.wishes];
    this.supported.add(wish.id);
    return { ...wish };
  }

  /** Newest first. */
  async list(): Promise<Wish[]> {
    await this.reach();
    return [...this.wishes]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((wish) => ({ ...wish }));
  }

  async setStatus(id: WishId, status: WishStatus): Promise<Wish> {
    await this.reach();
    const wish = this.wishes.find((w) => w.id === id);
    if (!wish) throw new RangeError(`Unknown wish ${id}`);
    return this.replace({ ...wish, status });
  }

  async quota(): Promise<WishQuota> {
    await this.reach();
    return this.currentQuota(this.now());
  }

  private currentQuota(now: Date): WishQuota {
    const quota = wishQuota(this.sentAt, now);
    if (!this.flags().quotaExhausted) return quota;
    return { ...quota, used: quota.limit, remaining: 0, exhausted: true };
  }

  private replace(wish: Wish): Wish {
    this.wishes = this.wishes.map((w) => (w.id === wish.id ? wish : w));
    return { ...wish };
  }

  private async reach() {
    if (this.delayMs > 0) await wait(this.delayMs);
    if (this.flags().connection === 'offline') throw new StationUnavailableError('WishSystem');
  }
}
