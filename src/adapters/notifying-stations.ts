import type { FeedbackHub } from '@/ports/feedback-hub';
import type { NotificationService } from '@/ports/notification-service';
import type { Rating, RatingInput } from '@/domain/rating';
import type { WishSystem } from '@/ports/wish-system';
import type { Wish, WishId, WishInput, WishStatus } from '@/domain/wish';

export class NotifyingFeedbackHub implements FeedbackHub {
  constructor(
    private readonly hub: FeedbackHub,
    private readonly notifications: NotificationService,
  ) {}

  async submitRating(input: RatingInput): Promise<Rating> {
    const rating = await this.hub.submitRating(input);
    await this.notifications.notifyModerator({ type: 'rating', rating });
    return rating;
  }

  list(): Promise<Rating[]> {
    return this.hub.list();
  }
}

export class NotifyingWishSystem implements WishSystem {
  constructor(
    private readonly system: WishSystem,
    private readonly notifications: NotificationService,
  ) {}

  async submitRequest(input: WishInput): Promise<Wish> {
    const wish = await this.system.submitRequest(input);
    await this.notifications.notifyModerator({ type: 'wish', wish });
    return wish;
  }

  list(): Promise<Wish[]> {
    return this.system.list();
  }

  setStatus(id: WishId, status: WishStatus): Promise<Wish> {
    return this.system.setStatus(id, status);
  }

  quota() {
    return this.system.quota();
  }
}
