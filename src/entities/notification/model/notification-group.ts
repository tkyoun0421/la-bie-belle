import type { NotificationItem } from "@/entities/notification/model/notification-item";

export type NotificationGroupKey = "today" | "this-week" | "earlier";

export type NotificationGroup = {
  key: NotificationGroupKey;
  items: NotificationItem[];
};

const SEOUL_DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toSeoulDayIndex(date: Date): number {
  const parts = SEOUL_DATE_PARTS_FORMATTER.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const utcMidnightMs = Date.UTC(Number(lookup.year), Number(lookup.month) - 1, Number(lookup.day));

  return utcMidnightMs / MS_PER_DAY;
}

export function groupNotificationsByRecency(
  items: readonly NotificationItem[],
  now: Date,
): NotificationGroup[] {
  const today: NotificationItem[] = [];
  const thisWeek: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  const nowDayIndex = toSeoulDayIndex(now);
  const nowWeekday = new Date(nowDayIndex * MS_PER_DAY).getUTCDay();
  const weekStartDayIndex = nowDayIndex - nowWeekday;
  const weekEndDayIndex = weekStartDayIndex + 6;

  for (const item of items) {
    const occurredAt = new Date(item.occurredAt);
    const dayIndex = toSeoulDayIndex(occurredAt);

    if (dayIndex === nowDayIndex) {
      today.push(item);
    } else if (dayIndex >= weekStartDayIndex && dayIndex <= weekEndDayIndex) {
      thisWeek.push(item);
    } else {
      earlier.push(item);
    }
  }

  return [
    { key: "today", items: today },
    { key: "this-week", items: thisWeek },
    { key: "earlier", items: earlier },
  ];
}
