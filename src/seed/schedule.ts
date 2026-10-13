import type { Show, ShowId } from '@/domain/show';

export type SlotKey = 'morgen' | 'tagwerk' | 'nachmittag' | 'feierabend' | 'nacht' | 'nachtschiene';

export type Slot = {
  key: SlotKey;
  title: string;
  hostName?: string;
  /** Minutes after midnight. A slot whose end is before its start runs past midnight. */
  start: number;
  end: number;
};

const hours = (h: number) => h * 60;

export const slots: readonly Slot[] = [
  {
    key: 'morgen',
    title: 'Welle am Morgen',
    hostName: 'Jana Brettschneider',
    start: hours(6),
    end: hours(10),
  },
  { key: 'tagwerk', title: 'Tagwerk', hostName: 'Timo Harms', start: hours(10), end: hours(14) },
  {
    key: 'nachmittag',
    title: 'Nachmittagswelle',
    hostName: 'Mirko Falk',
    start: hours(14),
    end: hours(18),
  },
  {
    key: 'feierabend',
    title: 'Feierabendwelle',
    hostName: 'Lena Osterkamp',
    start: hours(18),
    end: hours(20),
  },
  {
    key: 'nacht',
    title: 'Nachtschicht',
    hostName: 'Nuri Yildiz',
    start: hours(20),
    end: hours(23),
  },
  { key: 'nachtschiene', title: 'Nachtschiene', start: hours(23), end: hours(6) },
];

function minuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function atMinute(day: Date, minute: number): Date {
  const date = new Date(day);
  date.setHours(0, minute, 0, 0);
  return date;
}

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export class Schedule {
  constructor(private readonly slots: readonly Slot[]) {}

  get all(): readonly Slot[] {
    return this.slots;
  }

  slot(key: SlotKey): Slot {
    const slot = this.slots.find((s) => s.key === key);
    if (!slot) throw new RangeError(`Unknown slot ${key}`);
    return slot;
  }

  slotAt(date: Date): Slot {
    const minute = minuteOfDay(date);
    const slot = this.slots.find((s) =>
      s.start < s.end ? minute >= s.start && minute < s.end : minute >= s.start || minute < s.end,
    );
    if (!slot) throw new RangeError(`No slot covers ${date.toISOString()}`);
    return slot;
  }

  showAt(date: Date): Show {
    const slot = this.slotAt(date);
    const startedYesterday = slot.start > slot.end && minuteOfDay(date) < slot.end;
    const day = new Date(date);
    if (startedYesterday) day.setDate(day.getDate() - 1);

    const startsAt = atMinute(day, slot.start);
    const endsAt = atMinute(day, slot.start < slot.end ? slot.end : slot.end + hours(24));

    return {
      id: `${slot.key}-${dayKey(startsAt)}` as ShowId,
      title: slot.title,
      hostName: slot.hostName,
      startsAt,
      endsAt,
    };
  }
}

export const schedule = new Schedule(slots);
