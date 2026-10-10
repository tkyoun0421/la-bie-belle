// eslint-disable-next-line house/dto-segment
import type { PushReachableRow } from "@/entities/notification/api/notification.dto";
import {
  toNotification,
  toPushReachable,
} from "@/entities/notification/utils/notification.mapper";

describe("toNotification — 가지 아홉 열이 섞이지 않는다", () => {
  const ROW = {
    id: "n1",
    profile_id: "p1",
    kind: "admin_notice" as const,
    payload: { message: "공지" },
    subject_id: null,
    created_at: "2026-10-01T00:00:00Z",
    read_at: null,
    claimed_at: null,
    push_attempts: 0,
    pushed_at: null,
  };

  it("id·profile_id·kind·payload가 각자 제 필드로 간다", () => {
    const notification = toNotification(ROW);

    expect(notification.id).toBe("n1");
    expect(notification.profileId).toBe("p1");
    expect(notification.kind).toBe("admin_notice");
    expect(notification.payload).toEqual({ message: "공지" });
  });

  it("subject_id가 null이면 null로 간다", () => {
    const notification = toNotification(ROW);

    expect(notification.subjectId).toBeNull();
  });

  it("subject_id에 값이 있으면 그 값이 간다", () => {
    const notification = toNotification({ ...ROW, subject_id: "s1" });

    expect(notification.subjectId).toBe("s1");
  });

  it("읽은 때·수령한 때·보낸 때가 섞이지 않는다", () => {
    const notification = toNotification({
      ...ROW,
      read_at: "2026-10-02T00:00:00Z",
      claimed_at: "2026-10-03T00:00:00Z",
      pushed_at: "2026-10-04T00:00:00Z",
    });

    expect(notification.readAt).toBe("2026-10-02T00:00:00Z");
    expect(notification.claimedAt).toBe("2026-10-03T00:00:00Z");
    expect(notification.pushedAt).toBe("2026-10-04T00:00:00Z");
  });

  it("push_attempts와 created_at이 그대로 간다", () => {
    const notification = toNotification({ ...ROW, push_attempts: 3 });

    expect(notification.pushAttempts).toBe(3);
    expect(notification.createdAt).toBe("2026-10-01T00:00:00Z");
  });
});

describe("toPushReachable — 받을 수 있는 사람 행을 옮긴다", () => {
  it("profile_id가 profileId로, has_device가 hasDevice로 간다", () => {
    const row: PushReachableRow = {
      profile_id: "p1",
      has_device: true,
    };

    const pushReachable = toPushReachable(row);

    expect(pushReachable.profileId).toBe("p1");
    expect(pushReachable.hasDevice).toBe(true);
  });

  it("has_device가 false인 사람도 그대로 옮겨진다", () => {
    const row: PushReachableRow = {
      profile_id: "p2",
      has_device: false,
    };

    const pushReachable = toPushReachable(row);

    expect(pushReachable.hasDevice).toBe(false);
  });
});
