import {
  createAdminUser,
  createApprovedUser,
  seedPushToken,
  type AdminUser,
  type ApprovedUser,
} from "@tests/integration/postgres";

// 구현 대상: src/entities/notification/dals/get-push-reachable.ts
// AC-08(docs/3-build/plans/notification-settings.md) — push_reachable 뷰를 관리자로 읽어
// profile_id·has_device만 낸다. 관리자가 아니면 예외가 아니라 빈 배열이다.

const { getPushReachable } = await import(
  // @ts-expect-error 대상 모듈이 아직 없다
  "@/entities/notification/dals/get-push-reachable"
);

type ReachableRow = { profile_id: string; has_device: boolean };

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

  it("기기가 있는 사람과 없는 사람의 has_device가 갈린다", async () => {
    const rows: ReachableRow[] = await getPushReachable(admin.client);
    const byId = new Map(rows.map((row) => [row.profile_id, row]));

    expect(byId.get(withDevice.profileId)?.has_device).toBe(true);
    expect(byId.get(noDevice.profileId)?.has_device).toBe(false);
  });

  it("token은 안 온다 — profile_id와 has_device만 낸다", async () => {
    const rows: ReachableRow[] = await getPushReachable(admin.client);
    const row = rows.find((entry) => entry.profile_id === withDevice.profileId);

    expect(row).toBeDefined();
    expect(Object.keys(row as ReachableRow).sort()).toEqual([
      "has_device",
      "profile_id",
    ]);
  });

  it("관리자가 아니면 빈 배열이고 던지지 않는다", async () => {
    await expect(getPushReachable(noDevice.client)).resolves.toEqual([]);
  });
});
