import { describe, expect, it } from "vitest";
import { createAdminUser } from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

describe("approve_member", () => {
  it("관리자가 부르면 approved_at이 찍힌다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSignedInUser();

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

  it("거절됐던 사람을 승인하면 rejected_at이 비워진다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSignedInUser();

    await admin.client.rpc("reject_member", {
      profile_id: applicant.profileId,
    });

    const { error } = await admin.client.rpc("approve_member", {
      profile_id: applicant.profileId,
    });
    expect(error).toBeNull();

    const { data } = await admin.client
      .from("profiles")
      .select("rejected_at")
      .eq("id", applicant.profileId)
      .single<{ rejected_at: string | null }>();

    expect(data?.rejected_at).toBeNull();
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
