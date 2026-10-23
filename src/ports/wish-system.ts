import type { Wish, WishId, WishInput, WishStatus } from '@/domain/wish';
import type { WishQuota } from '@/domain/wish-quota';

export interface WishSystem {
  submitRequest(input: WishInput): Promise<Wish>;
  list(): Promise<Wish[]>;
  setStatus(id: WishId, status: WishStatus): Promise<Wish>;
  /** Quota of this device; the request system enforces it again on every request. */
  quota(): Promise<WishQuota>;
}
