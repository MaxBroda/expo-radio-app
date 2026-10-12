import { NotImplementedError } from '@/domain/errors';
import type { Wish, WishId, WishInput, WishStatus } from '@/domain/wish';
import type { WishSystem } from '@/ports/wish-system';

export class StubWishSystem implements WishSystem {
  async submitRequest(_input: WishInput): Promise<Wish> {
    throw new NotImplementedError('WishSystem.submitRequest');
  }

  async list(): Promise<Wish[]> {
    throw new NotImplementedError('WishSystem.list');
  }

  async setStatus(_id: WishId, _status: WishStatus): Promise<Wish> {
    throw new NotImplementedError('WishSystem.setStatus');
  }
}
