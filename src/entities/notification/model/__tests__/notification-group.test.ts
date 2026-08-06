import { addDays, startOfWeek, subDays } from "date-fns";
import { describe, expect, it } from "vitest";

import { groupNotificationsByRecency } from "@/entities/notification/model/notification-group";
import type { NotificationItem } from "@/entities/notification/model/notification-item";

function item(id: string, occurredAt: Date): NotificationItem {
  return {
    id,
    title: id,
    body: id,
    occurredAt: occurredAt.toISOString(),
    read: false,
    target: { screen: "pay" },
  };
}

describe("groupNotificationsByRecency", () => {
  it("오늘·이번 주·이전 3그룹으로 나눈다", () => {
    const now = new Date(2026, 7, 5, 12, 0, 0);
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });

    const today = item("today", now);
    const thisWeek = item("this-week", addDays(weekStart, 1));
    const earlier = item("earlier", subDays(weekStart, 3));

    const groups = groupNotificationsByRecency([today, thisWeek, earlier], now);

    expect(groups.find((group) => group.key === "today")?.items).toEqual(
      expect.arrayContaining([today]),
    );
    expect(groups.find((group) => group.key === "this-week")?.items).toEqual(
      expect.arrayContaining([thisWeek]),
    );
    expect(groups.find((group) => group.key === "earlier")?.items).toEqual(
      expect.arrayContaining([earlier]),
    );
  });

  it("빈 목록은 세 그룹 모두 비어 있다", () => {
    const groups = groupNotificationsByRecency([], new Date(2026, 7, 5));

    for (const group of groups) {
      expect(group.items).toHaveLength(0);
    }
  });
});
