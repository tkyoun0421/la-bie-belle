import { describe, expect, it } from "vitest";

import type { NotificationItem } from "@/entities/notification/model/notification-item";

describe("NotificationItem", () => {
  it("제목·내용·상대 시각 산출용 발생 시각·읽음·이동 대상을 갖는다", () => {
    const item: NotificationItem = {
      id: "noti-1",
      title: "근무 배정이 확정됐어요",
      body: "8월 9일 플로어 근무가 확정됐어요",
      occurredAt: "2026-08-06T09:00:00+09:00",
      read: false,
      target: { screen: "schedule-detail", date: "2026-08-09" },
    };

    expect(item.read).toBe(false);
    expect(item.target.screen).toBe("schedule-detail");
  });
});
