import type { Notification } from "@/entities/notification/model/notification.type";
import {
  createApprovedUser,
  queryColumn,
  seedNotifications,
  type ApprovedUser,
} from "@tests/integration/postgres";

const { getNotifications } =
  await import("@/entities/notification/api/getNotifications.api");

describe("알림 목록을 페이지로 읽는다", () => {
  it("남의 알림이 안 섞인다 — 본인 세션은 자기 행만 본다", async () => {
    const userA: ApprovedUser = await createApprovedUser();
    const userB: ApprovedUser = await createApprovedUser();

    const [notificationIdA] = seedNotifications(userA.profileId, 1);
    const [notificationIdB] = seedNotifications(userB.profileId, 1);

    const rowsForB: Notification[] = await getNotifications(userB.client, 0);
    const idsForB = rowsForB.map((row) => row.id);

    expect(idsForB).toContain(notificationIdB);
    expect(idsForB).not.toContain(notificationIdA);
  });

  it("51건을 심으면 첫 쪽이 50건이고 최근부터 내림차순이다", async () => {
    const user: ApprovedUser = await createApprovedUser();
    const ids = seedNotifications(user.profileId, 51);

    const firstPage: Notification[] = await getNotifications(user.client, 0);

    expect(firstPage).toHaveLength(50);
    expect(firstPage.map((row) => row.id)).toEqual(ids.slice(0, 50));
  });

  it("51건을 심으면 51번째가 둘째 쪽에 온다", async () => {
    const user: ApprovedUser = await createApprovedUser();
    const ids = seedNotifications(user.profileId, 51);

    const secondPage: Notification[] = await getNotifications(user.client, 1);

    expect(secondPage.map((row) => row.id)).toEqual([ids[50]]);
  });
});

describe("알림 목록은 같은 시각에 쌓인 알림에서도 쪽이 안 겹치고 안 빠진다", () => {
  it("created_at이 모두 같은 51건을 두 쪽으로 읽으면 합쳐 51건이고 겹침이 없다", async () => {
    const user: ApprovedUser = await createApprovedUser();
    const ids = queryColumn(
      "with inserted as (\n" +
        "  insert into public.notifications (profile_id, kind, payload, created_at)\n" +
        "  select :'profile_id', 'signup_approved', '{}'::jsonb, :'created_at'::timestamptz\n" +
        "  from generate_series(1, 51)\n" +
        "  returning id\n" +
        ")\n" +
        "select id from inserted;\n",
      { profile_id: user.profileId, created_at: "2030-01-01T00:00:00Z" },
    );

    const firstPage: Notification[] = await getNotifications(user.client, 0);
    const secondPage: Notification[] = await getNotifications(user.client, 1);
    const seen = [...firstPage, ...secondPage].map((row) => row.id);

    expect(seen).toHaveLength(51);
    expect(new Set(seen).size).toBe(51);
    expect(firstPage.map((row) => row.id)).toEqual(
      [...ids].sort().reverse().slice(0, 50),
    );
  });
});
