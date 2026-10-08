import {
  createApprovedUser,
  seedNotifications,
  type ApprovedUser,
} from "@tests/integration/postgres";

const { getNotifications } =
  await import("@/entities/notification/api/getNotifications.api");

type NotificationRow = { id: string };

describe("알림 목록을 페이지로 읽는다", () => {
  it("남의 알림이 안 섞인다 — 본인 세션은 자기 행만 본다", async () => {
    const userA: ApprovedUser = await createApprovedUser();
    const userB: ApprovedUser = await createApprovedUser();

    const [notificationIdA] = seedNotifications(userA.profileId, 1);
    const [notificationIdB] = seedNotifications(userB.profileId, 1);

    const rowsForB: NotificationRow[] = await getNotifications(userB.client, 0);
    const idsForB = rowsForB.map((row) => row.id);

    expect(idsForB).toContain(notificationIdB);
    expect(idsForB).not.toContain(notificationIdA);
  });

  it("51건을 심으면 첫 쪽이 50건이고 최근부터 내림차순이다", async () => {
    const user: ApprovedUser = await createApprovedUser();
    const ids = seedNotifications(user.profileId, 51);

    const firstPage: NotificationRow[] = await getNotifications(user.client, 0);

    expect(firstPage).toHaveLength(50);
    expect(firstPage.map((row) => row.id)).toEqual(ids.slice(0, 50));
  });

  it("51건을 심으면 51번째가 둘째 쪽에 온다", async () => {
    const user: ApprovedUser = await createApprovedUser();
    const ids = seedNotifications(user.profileId, 51);

    const secondPage: NotificationRow[] = await getNotifications(
      user.client,
      1,
    );

    expect(secondPage.map((row) => row.id)).toEqual([ids[50]]);
  });
});
