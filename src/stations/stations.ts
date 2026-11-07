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

/** What the stubs read from the demo: its clock and the states forced in the demo sheet. */
export type StubContext = { now: () => Date; flags: () => DemoFlags };
const realTime: StubContext = { now: () => new Date(), flags: () => defaultFlags };

export function createStubStations(
  context: StubContext = realTime,
  clock = new DemoClock(demoMoment(schedule.slot('feierabend'))),
): Stations {
  return {
    playout: new StubPlayout({ now: context.now, flags: context.flags }),
    musicDatabase: new StubMusicDatabase({ connection: () => context.flags().connection }),
    feedbackHub: new StubFeedbackHub(clock, { get: context.flags }),
    wishSystem: new StubWishSystem({ now: context.now, flags: context.flags }),
    notifications: new StubNotificationService(),
  };
}
