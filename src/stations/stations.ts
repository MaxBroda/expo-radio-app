import { NotifyingFeedbackHub, NotifyingWishSystem } from '@/adapters/notifying-stations';
import { StubFeedbackHub } from '@/adapters/stub/stub-feedback-hub';
import { StubMusicDatabase } from '@/adapters/stub/stub-music-database';
import { StubNotificationService } from '@/adapters/stub/stub-notification-service';
import { StubPlayout } from '@/adapters/stub/stub-playout';
import { StubWishSystem } from '@/adapters/stub/stub-wish-system';
import { DemoClock, demoMoment } from '@/demo/demo-clock';
import { defaultFlags, type DemoFlags } from '@/demo/demo-settings';
import type { FeedbackHub } from '@/ports/feedback-hub';
import type { MusicDatabase } from '@/ports/music-database';
import type { NotificationService } from '@/ports/notification-service';
import type { Playout } from '@/ports/playout';
import type { WishSystem } from '@/ports/wish-system';
import { schedule } from '@/seed/schedule';

export type Stations = {
  playout: Playout;
  musicDatabase: MusicDatabase;
  feedbackHub: FeedbackHub;
  wishSystem: WishSystem;
  notifications: NotificationService;
};

export type StubContext = {
  now: () => Date;
  flags: () => DemoFlags;
};

const defaultContext: StubContext = {
  now: () => new Date(),
  flags: () => defaultFlags,
};

export function createStubStations(
  context: StubContext = defaultContext,
  clock = new DemoClock(demoMoment(schedule.slot('feierabend'))),
): Stations {
  const playout = new StubPlayout({ now: context.now, flags: context.flags });
  const notifications = new StubNotificationService();
  const feedbackHub = new NotifyingFeedbackHub(
    new StubFeedbackHub(clock, { get: context.flags }),
    notifications,
  );
  const musicDatabase = new StubMusicDatabase({
    connection: () => context.flags().connection,
  });
  const wishSystem = new NotifyingWishSystem(
    new StubWishSystem({
      now: context.now,
      flags: context.flags,
      demoClock: clock,
    }),
    notifications,
  );

  return { playout, musicDatabase, feedbackHub, wishSystem, notifications };
}
