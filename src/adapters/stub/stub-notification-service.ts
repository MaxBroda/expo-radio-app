import type { StudioEvent } from '@/domain/studio-event';
import type { NotificationService, Unsubscribe } from '@/ports/notification-service';

export class StubNotificationService implements NotificationService {
  private handlers: ((event: StudioEvent) => void)[] = [];

  async notifyModerator(event: StudioEvent): Promise<void> {
    this.handlers.forEach((handler) => handler(event));
  }

  subscribe(handler: (event: StudioEvent) => void): Unsubscribe {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((other) => other !== handler);
    };
  }
}
