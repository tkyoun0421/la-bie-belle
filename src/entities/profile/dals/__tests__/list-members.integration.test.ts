import {
  createAdminUser,
  createApprovedUser,
  createBlockedUser,
  createRejectedUser,
  createSubmittedUser,
  execSql,
} from "@tests/integration/postgres";

type PendingRow = { id: string; submitted_at: string | null };

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
