import { demoDay, type DemoClock } from '@/demo/demo-clock';
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

  constructor(private readonly clock: DemoClock) {
    this.clockRevision = clock.revision;
    this.seedRatings();
  }

  private seedRatings() {
    const rotation = new Rotation(catalog, schedule, demoDay);
    this.ratings = new DemoRatings(rotation, schedule, new Random(42)).seed(this.clock.now());
  }

  private checkClock() {
    if (this.clockRevision !== this.clock.revision) {
      this.seedRatings();
      this.clockRevision = this.clock.revision;
    }
  }

  async submitRating(input: RatingInput): Promise<Rating> {
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
