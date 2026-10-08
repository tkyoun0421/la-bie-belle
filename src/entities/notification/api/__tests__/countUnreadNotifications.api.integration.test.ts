import {
  createApprovedUser,
  seedNotifications,
  type ApprovedUser,
} from "@tests/integration/postgres";

const { countUnreadNotifications } =
  await import("@/entities/notification/api/countUnreadNotifications.api");

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
