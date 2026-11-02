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
  private submittedRatings: Rating[] = [];
  private nextId = 1;
  private clockRevision: number;
  private demoMinute = 0;

  constructor(
    private readonly clock: DemoClock,
    private readonly settings = new DemoSettings(),
  ) {
    this.clockRevision = clock.revision;
    this.seedRatings();
  }

  private seedRatings() {
    const rotation = new Rotation(catalog, schedule, demoDay);
    const generator = new DemoRatings(rotation, schedule, new Random(42));
    this.demoMinute = Math.floor(this.clock.now().getTime() / 60_000);
    this.ratings = generator.seed(new Date(this.demoMinute * 60_000)).map((rating) => ({
      ...rating,
      id: `${rating.id}-${this.demoMinute}` as RatingId,
    }));
  }

  private checkClock() {
    if (this.clockRevision !== this.clock.revision) {
      this.submittedRatings = [];
      this.seedRatings();
      this.clockRevision = this.clock.revision;
    } else if (Math.floor(this.clock.now().getTime() / 60_000) !== this.demoMinute) {
      this.seedRatings();
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
    this.submittedRatings.unshift(rating);
    return rating;
  }

  async list(): Promise<Rating[]> {
    this.checkClock();
    return [...this.ratings, ...this.submittedRatings].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }
}
