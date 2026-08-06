import { describe, expect, it } from "vitest";

import {
  ALL_READ_NOTIFICATIONS,
  EMPTY_NOTIFICATIONS,
  MIXED_NOTIFICATIONS,
} from "@/entities/notification/model/notification-item.mock";

describe("notification-item mock", () => {
  it("혼합 시나리오는 읽지 않은 항목을 포함한다", () => {
    expect(MIXED_NOTIFICATIONS.some((item) => !item.read)).toBe(true);
  });

  it("전체 읽음 시나리오는 모든 항목이 읽음이다", () => {
    expect(ALL_READ_NOTIFICATIONS.every((item) => item.read)).toBe(true);
  });

  it("빈 상태 시나리오는 항목이 없다", () => {
    expect(EMPTY_NOTIFICATIONS).toHaveLength(0);
  });
});
