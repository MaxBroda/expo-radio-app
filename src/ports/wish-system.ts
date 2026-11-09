import type { Wish, WishId, WishInput, WishStatus } from '@/domain/wish';
import type { WishQuota } from '@/domain/wish-quota';

export interface WishSystem {
  list(): Promise<Wish[]>;
  quota(): Promise<WishQuota>;
  submitRequest(input: WishInput): Promise<Wish>;
  setStatus(id: WishId, status: WishStatus): Promise<Wish>;
}
