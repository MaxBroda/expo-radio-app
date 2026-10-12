import type { Wish, WishId, WishInput, WishStatus } from '@/domain/wish';

export interface WishSystem {
  submitRequest(input: WishInput): Promise<Wish>;
  list(): Promise<Wish[]>;
  setStatus(id: WishId, status: WishStatus): Promise<Wish>;
}
