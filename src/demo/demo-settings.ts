import type { Unsubscribe } from '@/ports/notification-service';

export type Connection = 'online' | 'loading' | 'offline';

export type DemoFlags = {
  connection: Connection;
  emptyHistory: boolean;
  sendFails: boolean;
  ratingWindowClosed: boolean;
  quotaExhausted: boolean;
  rush: boolean;
};

export const defaultFlags: DemoFlags = {
  connection: 'online',
  emptyHistory: false,
  sendFails: false,
  ratingWindowClosed: false,
  quotaExhausted: false,
  rush: false,
};

/** States the demo sheet forces; the adapters read them to fake slow or broken stations. */
export class DemoSettings {
  private flags = defaultFlags;
  private readonly listeners = new Set<() => void>();

  get(): DemoFlags {
    return this.flags;
  }

  set(patch: Partial<DemoFlags>) {
    this.flags = { ...this.flags, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  reset() {
    this.set(defaultFlags);
  }

  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
