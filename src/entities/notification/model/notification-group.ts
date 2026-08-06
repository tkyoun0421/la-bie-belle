import { endOfWeek, isSameDay, isWithinInterval, startOfWeek } from "date-fns";

import type { NotificationItem } from "@/entities/notification/model/notification-item";

export type NotificationGroupKey = "today" | "this-week" | "earlier";

export type NotificationGroup = {
  key: NotificationGroupKey;
  items: NotificationItem[];
};

export function groupNotificationsByRecency(
  items: readonly NotificationItem[],
  now: Date,
): NotificationGroup[] {
  const today: NotificationItem[] = [];
  const thisWeek: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

  for (const item of items) {
    const occurredAt = new Date(item.occurredAt);
    if (isSameDay(occurredAt, now)) {
      today.push(item);
    } else if (isWithinInterval(occurredAt, { start: weekStart, end: weekEnd })) {
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
