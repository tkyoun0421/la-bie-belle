import { describe, expect, it } from "vitest";

import type { ListNotificationsResult } from "@/entities/notification/api/list-notifications";
import { ERROR_CODE } from "@/shared/config/error-codes.config";
import { hasUnreadNotifications } from "@/widgets/app-shell/model/notification-bell";

describe("hasUnreadNotifications", () => {
  it("조회가 실패하면 읽지 않음 표시를 하지 않는다", () => {
    const failed: ListNotificationsResult = { ok: false, code: ERROR_CODE.COMMON_UNEXPECTED };
    expect(hasUnreadNotifications(failed)).toBe(false);
  });

  it("조회가 성공했지만 읽지 않은 알림이 없으면 표시하지 않는다", () => {
    const empty: ListNotificationsResult = { ok: true, items: [], unreadCount: 0 };
    expect(hasUnreadNotifications(empty)).toBe(false);
  });

  it("조회가 성공하고 읽지 않은 알림이 있으면 표시한다", () => {
    const unread: ListNotificationsResult = { ok: true, items: [], unreadCount: 2 };
    expect(hasUnreadNotifications(unread)).toBe(true);
  });
});
