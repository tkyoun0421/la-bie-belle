import {
  listActiveMembers,
  listLeftMembers,
  listPendingMembers,
  listBlockedMembers,
} from "@/entities/member/api/listMembers.api";
import type { Member } from "@/entities/member/model/member.type";
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

type PendingRow = { id: string; submitted_at: string | null };

type MemberReach = Member & {
  notificationsEnabled?: boolean;
  hasDevice?: boolean;
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
    )) as unknown as MemberReach[];
    const byId = new Map(rows.map((row) => [row.id, row]));

    expect(byId.get(off.profileId)?.notificationsEnabled).toBe(false);
    expect(byId.get(off.profileId)?.hasDevice).toBe(false);

    expect(byId.get(onNoDevice.profileId)?.notificationsEnabled).toBe(true);
    expect(byId.get(onNoDevice.profileId)?.hasDevice).toBe(false);

    expect(byId.get(onWithDevice.profileId)?.notificationsEnabled).toBe(true);
    expect(byId.get(onWithDevice.profileId)?.hasDevice).toBe(true);
  });
});

describe("퇴사 구획에는 알림 갈래가 안 붙는다(AC-08)", () => {
  it("퇴사한 사람의 목록 행에 notificationsEnabled·hasDevice가 없다", async () => {
    const admin: AdminUser = await createAdminUser();

    const left = await createLeftUser();
    setSubmittedAt(left.userId, new Date().toISOString());
    seedPushToken(left.profileId);

    const rows = (await listLeftMembers(
      admin.client,
    )) as unknown as MemberReach[];
    const row = rows.find((entry) => entry.id === left.profileId);

    expect(row).toBeDefined();
    expect(row?.notificationsEnabled).toBeUndefined();
    expect(row?.hasDevice).toBeUndefined();
  });
});

describe("listPendingMembers — 대기 목록을 도메인 모양으로 읽는다", () => {
  it("제출만 하고 결정이 안 난 사람만 제출 시각 오름차순으로 낸다", async () => {
    const admin = await createAdminUser();
    const first = await createSubmittedUser();
    setSubmittedAt(first.userId, "2026-01-01T00:00:00+09:00");
    const second = await createSubmittedUser();
    setSubmittedAt(second.userId, "2026-01-02T00:00:00+09:00");
    const approved = await createApprovedUser();
    const rejected = await createRejectedUser();
    const blocked = await createBlockedUser();
    const wanted = new Set([
      first.profileId,
      second.profileId,
      approved.profileId,
      rejected.profileId,
      blocked.profileId,
    ]);

    const rows = await listPendingMembers(admin.client);

    expect(
      rows.filter((row) => wanted.has(row.id)).map((row) => row.id),
    ).toEqual([first.profileId, second.profileId]);
  });
});

describe("listBlockedMembers — 차단 목록을 도메인 모양으로 읽는다", () => {
  it("차단된 사람은 들고 승인만 된 사람은 안 든다", async () => {
    const admin = await createAdminUser();
    const blocked = await createBlockedUser();
    const approved = await createApprovedUser();

    const rows = await listBlockedMembers(admin.client);
    const ids = rows.map((row) => row.id);

    expect(ids).toContain(blocked.profileId);
    expect(ids).not.toContain(approved.profileId);
  });

  it("차단 시각이 찍혀 있다", async () => {
    const admin = await createAdminUser();
    const blocked = await createBlockedUser();

    const rows = await listBlockedMembers(admin.client);
    const row = rows.find((entry) => entry.id === blocked.profileId);

    expect(row?.blockedAt).not.toBeNull();
  });
});
