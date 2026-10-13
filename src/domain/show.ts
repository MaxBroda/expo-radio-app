import type { Brand } from './brand';

export type ShowId = Brand<string, 'ShowId'>;

export type Show = {
  id: ShowId;
  title: string;
  /** Absent for unmoderated slots. */
  hostName?: string;
  startsAt: Date;
  endsAt: Date;
};
