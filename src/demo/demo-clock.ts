import type { Unsubscribe } from '@/ports/notification-service';
import type { Slot } from '@/seed/schedule';

/** A Thursday, so the demo never depends on the day it is presented. */
export const demoDay = new Date(2026, 9, 15);

const minutesIntoShow = 42;

export function demoMoment(slot: Slot): Date {
  const date = new Date(demoDay);
  date.setHours(0, slot.start + minutesIntoShow, 0, 0);
  return date;
}

/** Starts at a fixed demo time and runs in real time from there; the demo sheet can jump. */
export class DemoClock {
  private anchor: number;
  private anchoredAt: number;
  private readonly listeners = new Set<() => void>();

  constructor(
    start: Date,
    private readonly realNow: () => number = Date.now,
  ) {
    this.anchor = start.getTime();
    this.anchoredAt = realNow();
  }

  now(): Date {
    return new Date(this.anchor + this.realNow() - this.anchoredAt);
  }

  jumpTo(date: Date) {
    this.anchor = date.getTime();
    this.anchoredAt = this.realNow();
    this.listeners.forEach((listener) => listener());
  }

  /** Fires on jumps only, not on every tick. */
  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
