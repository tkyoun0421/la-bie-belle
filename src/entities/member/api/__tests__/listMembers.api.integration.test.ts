import {
  listActiveMembers,
  listLeftMembers,
  type MemberRow,
} from "@/entities/member/api/listMembers.api";
import {
  createAdminUser,
  createApprovedUser,
  createBlockedUser,
  createLeftUser,
  createRejectedUser,
  createSubmittedUser,
  execSql,
  seedPushToken,
  type AdminUser,
} from "@tests/integration/postgres";

// 구현 대상: src/entities/profile/api/listMembers.api.ts
// AC-08(docs/3-build/plans/notification-settings.md) — 직원 목록이 notifications_enabled와
// push_tokens 유무(has_device)를 같이 읽어 갈래 셋을 구별하게 한다. 퇴사자에게는 안 붙는다.

type PendingRow = { id: string; submitted_at: string | null };

type MemberReachRow = MemberRow & {
  notifications_enabled?: boolean;
  has_device?: boolean;
};

function setSubmittedAt(userId: string, submittedAt: string): void {
  execSql(
    "update public.profiles set submitted_at = :'submitted_at' where user_id = :'user_id';\n",
    { user_id: userId, submitted_at: submittedAt },
  );
}

describe("관리자가 profiles를 읽어 대기 목록을 만든다", () => {
  it("제출됨 대상만 submitted_at asc로 온다", async () => {
    const admin = await createAdminUser();

    const first = await createSubmittedUser();
    setSubmittedAt(first.userId, "2026-01-01T00:00:00+09:00");
    const second = await createSubmittedUser();
    setSubmittedAt(second.userId, "2026-01-02T00:00:00+09:00");
    const third = await createSubmittedUser();
    setSubmittedAt(third.userId, "2026-01-03T00:00:00+09:00");

    const approved = await createApprovedUser();
    const rejected = await createRejectedUser();
    const blocked = await createBlockedUser();

    const createdIds = [
      first.profileId,
      second.profileId,
      third.profileId,
      approved.profileId,
      rejected.profileId,
      blocked.profileId,
    ];

    const { data, error } = await admin.client
      .from("profiles")
      .select("id, submitted_at")
      .in("id", createdIds)
      .not("submitted_at", "is", null)
      .is("approved_at", null)
      .is("rejected_at", null)
      .is("blocked_at", null)
      .order("submitted_at", { ascending: true })
      .returns<PendingRow[]>();

    expect(error).toBeNull();
    expect((data ?? []).map((row) => row.id)).toEqual([
      first.profileId,
      second.profileId,
      third.profileId,
    ]);
  });

  it("승인된 근무자는 profiles 행은 받아도 profile_private는 0행이다", async () => {
    const worker = await createApprovedUser();
    const other = await createSubmittedUser();

    const { data: profileRow, error: profileError } = await worker.client
      .from("profiles")
      .select("id")
      .eq("id", other.profileId)
      .maybeSingle<{ id: string }>();

    expect(profileError).toBeNull();
    expect(profileRow?.id).toBe(other.profileId);

    const { data: privateRows, error: privateError } = await worker.client
      .from("profile_private")
      .select("profile_id")
      .eq("profile_id", other.profileId);

    expect(privateError).toBeNull();
    expect(privateRows).toEqual([]);
  });

  it("승인 전 계정은 profiles에서 본인 행만 읽는다", async () => {
    const applicant = await createSubmittedUser();
    await createSubmittedUser();
    await createApprovedUser();

    const { data, error } = await applicant.client
      .from("profiles")
      .select("id");

    expect(error).toBeNull();
    expect(data).toEqual([{ id: applicant.profileId }]);
  });
});

describe("재직자 목록이 알림 갈래를 같이 낸다(AC-08)", () => {
  it("끈 사람·켰는데 기기 없는 사람·켰고 기기 있는 사람이 각자 값으로 구별된다", async () => {
    const admin: AdminUser = await createAdminUser();

    const off = await createApprovedUser();
    setSubmittedAt(off.userId, new Date().toISOString());
    const { error: turnOffError } = await off.client.rpc(
      "set_notifications_enabled",
      { p_on: false },
    );
    expect(turnOffError).toBeNull();

    const onNoDevice = await createApprovedUser();
    setSubmittedAt(onNoDevice.userId, new Date().toISOString());

    const onWithDevice = await createApprovedUser();
    setSubmittedAt(onWithDevice.userId, new Date().toISOString());
    seedPushToken(onWithDevice.profileId);

    const rows = (await listActiveMembers(
      admin.client,
    )) as unknown as MemberReachRow[];
    const byId = new Map(rows.map((row) => [row.id, row]));

    expect(byId.get(off.profileId)?.notifications_enabled).toBe(false);
    expect(byId.get(off.profileId)?.has_device).toBe(false);

    expect(byId.get(onNoDevice.profileId)?.notifications_enabled).toBe(true);
    expect(byId.get(onNoDevice.profileId)?.has_device).toBe(false);

    expect(byId.get(onWithDevice.profileId)?.notifications_enabled).toBe(true);
    expect(byId.get(onWithDevice.profileId)?.has_device).toBe(true);
  });
});

describe("퇴사 구획에는 알림 갈래가 안 붙는다(AC-08)", () => {
  it("퇴사한 사람의 목록 행에 notifications_enabled·has_device가 없다", async () => {
    const admin: AdminUser = await createAdminUser();

    const left = await createLeftUser();
    setSubmittedAt(left.userId, new Date().toISOString());
    seedPushToken(left.profileId);

    const rows = (await listLeftMembers(
      admin.client,
    )) as unknown as MemberReachRow[];
    const row = rows.find((entry) => entry.id === left.profileId);

    expect(row).toBeDefined();
    expect(row?.notifications_enabled).toBeUndefined();
    expect(row?.has_device).toBeUndefined();
  });
});
