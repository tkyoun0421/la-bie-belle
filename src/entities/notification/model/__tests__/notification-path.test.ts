import { describe, expect, it } from "vitest";

import { resolveNotificationPath } from "@/entities/notification/model/notification-path";
import type { NotificationTarget } from "@/entities/notification/model/notification-item";

describe("resolveNotificationPath", () => {
  it("schedule-detail은 날짜 상세 경로를 반환한다", () => {
    expect(resolveNotificationPath({ screen: "schedule-detail", date: "2026-08-09" })).toBe(
      "/schedule/2026-08-09",
    );
  });

  it("pay는 급여 경로를 반환한다", () => {
    expect(resolveNotificationPath({ screen: "pay" })).toBe("/pay");
  });

  it("schedule은 month 쿼리를 담은 일정 경로를 반환한다", () => {
    expect(resolveNotificationPath({ screen: "schedule", month: "2026-08" })).toBe(
      "/schedule?month=2026-08",
    );
  });

  it("schedule의 month 형식이 불량이면 알림함 폴백 경로를 반환한다", () => {
    expect(resolveNotificationPath({ screen: "schedule", month: "2026-8" })).toBe("/notifications");
    expect(resolveNotificationPath({ screen: "schedule", month: "aug-2026" })).toBe(
      "/notifications",
    );
  });

  it("알 수 없는 screen은 알림함 폴백 경로를 반환한다", () => {
    const unknownTarget = { screen: "unknown" } as unknown as NotificationTarget;
    expect(resolveNotificationPath(unknownTarget)).toBe("/notifications");
  });
});
