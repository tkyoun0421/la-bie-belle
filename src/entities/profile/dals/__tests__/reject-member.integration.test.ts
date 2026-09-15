import { describe, expect, it } from "vitest";
import {
  createAdminUser,
  createApprovedUser,
} from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

describe("reject_member", () => {
  it("관리자가 부르면 rejected_at이 찍힌다", async () => {
    const admin = await createAdminUser();
    const applicant = await createSignedInUser();

    const { error } = await admin.client.rpc("reject_member", {
      profile_id: applicant.profileId,
    });
    expect(error).toBeNull();

    const { data } = await admin.client
      .from("profiles")
      .select("rejected_at")
      .eq("id", applicant.profileId)
      .single<{ rejected_at: string | null }>();

    expect(data?.rejected_at).not.toBeNull();
  });

  it("이미 승인된 사람은 already_approved로 막힌다", async () => {
    const admin = await createAdminUser();
    const approved = await createApprovedUser();

    const { error } = await admin.client.rpc("reject_member", {
      profile_id: approved.profileId,
    });

    expect(error?.message).toBe("already_approved");
  });

  it("관리자가 아니면 forbidden으로 막힌다", async () => {
    const nonAdmin = await createSignedInUser();
    const applicant = await createSignedInUser();

    const { error } = await nonAdmin.client.rpc("reject_member", {
      profile_id: applicant.profileId,
    });

    expect(error?.message).toBe("forbidden");
  });
});
