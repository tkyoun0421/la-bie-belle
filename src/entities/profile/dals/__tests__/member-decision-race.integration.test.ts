import {
  createAdminUser,
  createBlockedUser,
  createRejectedUser,
  createSubmittedUser,
} from "@tests/integration/postgres";

describe("가입 결정이 겹치면 늦게 누른 쪽이 already_decided를 받는다", () => {
  it("승인 뒤 거절하면 already_decided로 막힌다", async () => {
    const adminA = await createAdminUser();
    const adminB = await createAdminUser();
    const applicant = await createSubmittedUser();

    const first = await adminA.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });
    expect(first.error).toBeNull();

    const second = await adminB.client.rpc("reject_member", {
      profile_id: applicant.profileId,
    });
    expect(second.error?.message).toBe("already_decided");
  });

  it("승인 뒤 재승인하면 already_decided로 막힌다", async () => {
    const adminA = await createAdminUser();
    const adminB = await createAdminUser();
    const applicant = await createSubmittedUser();

    const first = await adminA.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });
    expect(first.error).toBeNull();

    const second = await adminB.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });
    expect(second.error?.message).toBe("already_decided");
  });

  it("차단 뒤 승인하면 already_decided로 막힌다", async () => {
    const admin = await createAdminUser();
    const blocked = await createBlockedUser();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: blocked.profileId,
    });

    expect(error?.message).toBe("already_decided");
  });

  it("거절 뒤 승인하면 already_decided로 막힌다", async () => {
    const admin = await createAdminUser();
    const rejected = await createRejectedUser();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: rejected.profileId,
    });

    expect(error?.message).toBe("already_decided");
  });

  it("차단을 푼 뒤 승인하면 제출 전으로 돌아가 already_decided로 막힌다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSubmittedUser();

    const blocked = await admin.client.rpc("block_member", {
      profile_id: applicant.profileId,
    });
    expect(blocked.error).toBeNull();

    const unblocked = await admin.client.rpc("unblock_member", {
      profile_id: applicant.profileId,
    });
    expect(unblocked.error).toBeNull();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });

    expect(error?.message).toBe("already_decided");
  });
});
