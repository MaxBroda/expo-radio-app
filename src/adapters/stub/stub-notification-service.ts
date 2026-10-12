import { NotImplementedError } from '@/domain/errors';
import type { StudioEvent } from '@/domain/studio-event';
import type { NotificationService, Unsubscribe } from '@/ports/notification-service';

export class StubNotificationService implements NotificationService {
  async notifyModerator(_event: StudioEvent): Promise<void> {
    throw new NotImplementedError('NotificationService.notifyModerator');
  }

  subscribe(_handler: (event: StudioEvent) => void): Unsubscribe {
    throw new NotImplementedError('NotificationService.subscribe');
  }
}
