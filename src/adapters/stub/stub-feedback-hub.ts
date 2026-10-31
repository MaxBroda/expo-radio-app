import type { DemoClock } from '@/demo/demo-clock';
import type { Rating, RatingId, RatingInput } from '@/domain/rating';
import type { FeedbackHub } from '@/ports/feedback-hub';

export class StubFeedbackHub implements FeedbackHub {
  private ratings: Rating[] = [];
  private nextId = 1;
  private clockRevision: number;

  constructor(private readonly clock: DemoClock) {
    this.clockRevision = clock.revision;
  }

  private checkClock() {
    if (this.clockRevision !== this.clock.revision) {
      this.ratings = [];
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
