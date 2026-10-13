import { NOTIFICATION_KINDS } from "@/entities/notification/consts/notification.const";
import { isNotificationKind } from "@/entities/notification/model/notificationKind.policy";

describe("isNotificationKind — 알림 종류 글자만 참이다", () => {
  it("알림 종류 목록의 글자는 모두 참이다", () => {
    expect(NOTIFICATION_KINDS.every((kind) => isNotificationKind(kind))).toBe(
      true,
    );
  });

  it("모르는 글자는 거짓이다", () => {
    expect(isNotificationKind("unknown_kind")).toBe(false);
    expect(isNotificationKind("")).toBe(false);
  });

  it("글자가 아닌 값은 거짓이다", () => {
    expect(isNotificationKind(null)).toBe(false);
    expect(isNotificationKind(undefined)).toBe(false);
    expect(isNotificationKind(0)).toBe(false);
  });
});
