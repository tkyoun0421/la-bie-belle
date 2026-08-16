import { addDays, startOfWeek, subDays } from "date-fns";
import { afterEach, describe, expect, it, vi } from "vitest";

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

function itemAt(id: string, isoString: string): NotificationItem {
  return {
    id,
    title: id,
    body: id,
    occurredAt: isoString,
    read: false,
    target: { screen: "pay" },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

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

  it.each(["UTC", "Asia/Seoul", "America/New_York"])(
    "실행 환경 타임존(%s)이 달라도 KST 자정 직전·직후 경계로 오늘·이번 주를 나눈다",
    (tz) => {
      vi.stubEnv("TZ", tz);

      const now = itemAt("now", "2026-08-09T15:30:00Z");
      const justBeforeMidnightKst = itemAt("before", "2026-08-09T14:59:59Z");
      const justAfterMidnightKst = itemAt("after", "2026-08-09T15:00:01Z");

      const groups = groupNotificationsByRecency(
        [justBeforeMidnightKst, justAfterMidnightKst],
        new Date(now.occurredAt),
      );

      expect(groups.find((group) => group.key === "today")?.items).toEqual([justAfterMidnightKst]);
      expect(groups.find((group) => group.key === "this-week")?.items).toEqual([
        justBeforeMidnightKst,
      ]);
    },
  );

  it.each(["UTC", "Asia/Seoul", "America/New_York"])(
    "실행 환경 타임존(%s)이 달라도 주 시작은 KST 기준 일요일이다",
    (tz) => {
      vi.stubEnv("TZ", tz);

      const sundayNow = itemAt("now", "2026-08-09T01:00:00+09:00");
      const previousSaturday = itemAt("prev-sat", "2026-08-08T12:00:00+09:00");
      const followingSaturday = itemAt("next-sat", "2026-08-15T12:00:00+09:00");

      const groups = groupNotificationsByRecency(
        [previousSaturday, followingSaturday],
        new Date(sundayNow.occurredAt),
      );

      expect(groups.find((group) => group.key === "earlier")?.items).toEqual([previousSaturday]);
      expect(groups.find((group) => group.key === "this-week")?.items).toEqual([followingSaturday]);
    },
  );

  it("같은 절대 시각 집합을 넣으면 실행 환경 타임존과 무관하게 동일한 분류 결과를 낸다", () => {
    const now = new Date("2026-08-09T15:30:00Z");
    const items = [
      itemAt("a", "2026-08-09T14:59:59Z"),
      itemAt("b", "2026-08-02T00:00:00Z"),
      itemAt("c", "2026-07-20T00:00:00Z"),
    ];

    vi.stubEnv("TZ", "UTC");
    const utcResult = groupNotificationsByRecency(items, now);

    vi.stubEnv("TZ", "Pacific/Kiritimati");
    const farAheadResult = groupNotificationsByRecency(items, now);

    expect(farAheadResult.map((group) => group.items.map((entry) => entry.id))).toEqual(
      utcResult.map((group) => group.items.map((entry) => entry.id)),
    );
  });
});
