import {
  createAdminUser,
  createApprovedUser,
  createBlockedUser,
  createRejectedUser,
  createSubmittedUser,
} from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

describe("approve_member", () => {
  it("관리자가 부르면 approved_at이 찍힌다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSubmittedUser();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });
    expect(error).toBeNull();

    const { data } = await admin.client
      .from("profiles")
      .select("approved_at")
      .eq("id", applicant.profileId)
      .single<{ approved_at: string | null }>();

    expect(data?.approved_at).not.toBeNull();
  });

  it("이미 승인된 사람을 다시 승인하면 already_decided로 막힌다", async () => {
    const admin = await createAdminUser();
    const approved = await createApprovedUser();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: approved.profileId,
    });

    expect(error?.message).toBe("already_decided");
  });

  it("거절된 사람을 승인하면 already_decided로 막힌다", async () => {
    const admin = await createAdminUser();
    const rejected = await createRejectedUser();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: rejected.profileId,
    });

    expect(error?.message).toBe("already_decided");
  });

  it("차단된 사람을 승인하면 already_decided로 막힌다", async () => {
    const admin = await createAdminUser();
    const blocked = await createBlockedUser();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: blocked.profileId,
    });

    expect(error?.message).toBe("already_decided");
  });

  it("프로필을 안 보낸 사람을 승인하면 already_decided로 막힌다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSignedInUser();

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });

    expect(error?.message).toBe("already_decided");
  });

  it("관리자가 아니면 not_allowed으로 막힌다", async () => {
    const nonAdmin = await createSignedInUser();
    const applicant = await createSignedInUser();

    const { error } = await nonAdmin.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });

    expect(error?.message).toBe("not_allowed");
  });
});
