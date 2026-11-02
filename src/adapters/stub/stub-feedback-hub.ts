import { demoDay, type DemoClock } from '@/demo/demo-clock';
import { DemoSettings } from '@/demo/demo-settings';
import { StationUnavailableError } from '@/domain/errors';
import type { Rating, RatingId, RatingInput } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';
import { catalog } from '@/seed/catalog';
import { DemoRatings } from '@/seed/demo-seed';
import { Random } from '@/seed/random';
import { Rotation } from '@/seed/rotation';
import { schedule } from '@/seed/schedule';

export class StubFeedbackHub implements FeedbackHub {
  private ratings: Rating[] = [];
  private nextId = 1;
  private clockRevision: number;
  private demoRatings!: DemoRatings;
  private nextDemoRatingAt = 0;

  constructor(
    private readonly clock: DemoClock,
    private readonly settings = new DemoSettings(),
  ) {
    this.clockRevision = clock.revision;
    this.seedRatings();
  }

  private seedRatings() {
    const rotation = new Rotation(catalog, schedule, demoDay);
    this.demoRatings = new DemoRatings(rotation, schedule, new Random(42));
    const now = this.clock.now();
    this.ratings = this.demoRatings.seed(now);
    this.nextDemoRatingAt = now.getTime() + 60_000;
  }

  private checkClock() {
    if (this.clockRevision !== this.clock.revision) {
      this.seedRatings();
      this.clockRevision = this.clock.revision;
    }
    const now = this.clock.now().getTime();
    while (this.nextDemoRatingAt <= now) {
      this.ratings.unshift(this.demoRatings.next(new Date(this.nextDemoRatingAt)));
      this.nextDemoRatingAt += 60_000;
    }
  }

  async submitRating(input: RatingInput): Promise<Rating> {
    if (this.settings.get().sendFails) throw new StationUnavailableError('FeedbackHub');
    this.checkClock();
    const rating: Rating = {
      ...input,
      id: `rating-${this.nextId++}` as RatingId,
      createdAt: this.clock.now(),
    };
    this.ratings.unshift(rating);
    return rating;
  }

  async list(): Promise<Rating[]> {
    this.checkClock();
    return [...this.ratings];
  }
}
