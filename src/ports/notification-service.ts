import type { StudioEvent } from '@/domain/studio-event';

export type Unsubscribe = () => void;

export interface NotificationService {
  notifyModerator(event: StudioEvent): Promise<void>;
  subscribe(handler: (event: StudioEvent) => void): Unsubscribe;
}
