import type { PushReachable } from "@/entities/notification/model/notification.type";
import {
  createAdminUser,
  createApprovedUser,
  seedPushToken,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

const { getPushReachable } =
  await import("@/entities/notification/api/getPushReachable.api");

describe("관리자가 push_reachable을 읽는다", () => {
  let admin: AdminUser;
  let withDevice: ApprovedUser;
  let noDevice: ApprovedUser;

  beforeAll(async () => {
    admin = await createAdminUser();
    withDevice = await createApprovedUser();
    noDevice = await createApprovedUser();
    seedPushToken(withDevice.profileId);
  });

  it("기기가 있는 사람과 없는 사람의 hasDevice가 갈린다", async () => {
    const rows: PushReachable[] = await getPushReachable(admin.client);
    const byId = new Map(rows.map((row) => [row.profileId, row]));

    expect(byId.get(withDevice.profileId)?.hasDevice).toBe(true);
    expect(byId.get(noDevice.profileId)?.hasDevice).toBe(false);
  });

  it("token은 안 온다 — profileId와 hasDevice만 낸다", async () => {
    const rows: PushReachable[] = await getPushReachable(admin.client);
    const row = rows.find((entry) => entry.profileId === withDevice.profileId);

    expect(row).toBeDefined();
    expect(Object.keys(row as PushReachable).sort()).toEqual([
      "hasDevice",
      "profileId",
    ]);
  });

  it("관리자가 아니면 빈 배열이고 던지지 않는다", async () => {
    await expect(getPushReachable(noDevice.client)).resolves.toEqual([]);
  });
});
