import type { Brand } from './brand';

export type ShowId = Brand<string, 'ShowId'>;

export type Show = {
  id: ShowId;
  title: string;
  hostName: string;
  startsAt: Date;
  endsAt: Date;
};
