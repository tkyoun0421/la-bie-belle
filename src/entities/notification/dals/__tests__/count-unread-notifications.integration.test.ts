import {
  createApprovedUser,
  seedNotifications,
  type ApprovedUser,
} from "@tests/integration/postgres";

// 구현 대상: src/entities/notification/dals/count-unread-notifications.ts
// AC-03·AC-06(docs/3-build/plans/notification-list.md) — 안 읽은 수는 ['notifications','unread']
// 키로 따로 센다. range()를 타면 50에서 멈추니 head:true count 질의라야 한다.

// @ts-expect-error 대상 모듈이 아직 없다
const { countUnreadNotifications } =
  await import("@/entities/notification/dals/count-unread-notifications");

describe("안 읽은 알림 수를 센다", () => {
  it("안 읽은 알림이 51건이면 50건 창에 안 갇히고 51을 낸다", async () => {
    const user: ApprovedUser = await createApprovedUser();
    seedNotifications(user.profileId, 51);

    const count: number = await countUnreadNotifications(user.client);

    expect(count).toBe(51);
  });

  it("안 읽은 알림이 없으면 0이다", async () => {
    const user: ApprovedUser = await createApprovedUser();

    const count: number = await countUnreadNotifications(user.client);

    expect(count).toBe(0);
  });
});
