import { StubFeedbackHub } from '@/adapters/stub/stub-feedback-hub';
import { StubMusicDatabase } from '@/adapters/stub/stub-music-database';
import { StubNotificationService } from '@/adapters/stub/stub-notification-service';
import { StubPlayout } from '@/adapters/stub/stub-playout';
import { StubWishSystem } from '@/adapters/stub/stub-wish-system';
import type { FeedbackHub } from '@/ports/feedback-hub';
import type { MusicDatabase } from '@/ports/music-database';
import type { NotificationService } from '@/ports/notification-service';
import type { Playout } from '@/ports/playout';
import type { WishSystem } from '@/ports/wish-system';

export type Stations = {
  playout: Playout;
  musicDatabase: MusicDatabase;
  feedbackHub: FeedbackHub;
  wishSystem: WishSystem;
  notifications: NotificationService;
};

export function createStubStations(): Stations {
  return {
    playout: new StubPlayout(),
    musicDatabase: new StubMusicDatabase(),
    feedbackHub: new StubFeedbackHub(),
    wishSystem: new StubWishSystem(),
    notifications: new StubNotificationService(),
  };
}
