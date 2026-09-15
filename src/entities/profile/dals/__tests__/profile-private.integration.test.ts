import { describe, expect, it } from "vitest";
import { createAdminUser } from "@tests/integration/postgres";
import {
  createSignedInUser,
  type SignedInUser,
} from "@tests/integration/supabase";

async function submitProfile(user: SignedInUser, phone: string): Promise<void> {
  const { error } = await user.client.rpc("submit_profile", {
    display_name: "다희",
    phone,
    birth_date: "1990-01-01",
    gender: "female",
  });
  if (error) {
    throw error;
  }
}

describe("profile_private 접근 권한", () => {
  it("본인은 자기 profile_private 행을 읽는다", async () => {
    const user = await createSignedInUser();
    await submitProfile(user, "010-0000-0001");

    const { data, error } = await user.client
      .from("profile_private")
      .select("profile_id")
      .eq("profile_id", user.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([{ profile_id: user.profileId }]);
  });

  it("남의 profile_private 행은 못 읽는다", async () => {
    const other = await createSignedInUser();
    await submitProfile(other, "010-0000-0002");
    const reader = await createSignedInUser();

    const { data, error } = await reader.client
      .from("profile_private")
      .select("profile_id")
      .eq("profile_id", other.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("관리자는 남의 profile_private 행을 읽는다", async () => {
    const other = await createSignedInUser();
    await submitProfile(other, "010-0000-0003");
    const admin = await createAdminUser();

    const { data, error } = await admin.client
      .from("profile_private")
      .select("profile_id")
      .eq("profile_id", other.profileId);

    expect(error).toBeNull();
    expect(data).toEqual([{ profile_id: other.profileId }]);
  });

  it("본인은 자기 phone을 직접 고친다", async () => {
    const user = await createSignedInUser();
    await submitProfile(user, "010-0000-0004");

    const { error } = await user.client
      .from("profile_private")
      .update({ phone: "010-0000-0005" })
      .eq("profile_id", user.profileId);

    expect(error).toBeNull();

    const { data } = await user.client
      .from("profile_private")
      .select("phone")
      .eq("profile_id", user.profileId);

    expect(data).toEqual([{ phone: "010-0000-0005" }]);
  });

  it("본인이 자기 birth_date는 직접 못 고친다", async () => {
    const user = await createSignedInUser();
    await submitProfile(user, "010-0000-0006");

    const { error } = await user.client
      .from("profile_private")
      .update({ birth_date: "1991-02-02" })
      .eq("profile_id", user.profileId);

    expect(error?.code).toBe("42501");
  });

  it("남의 phone을 못 고친다", async () => {
    const other = await createSignedInUser();
    await submitProfile(other, "010-0000-0007");
    const writer = await createSignedInUser();

    const { error } = await writer.client
      .from("profile_private")
      .update({ phone: "010-0000-0008" })
      .eq("profile_id", other.profileId);

    expect(error).toBeNull();

    const { data } = await other.client
      .from("profile_private")
      .select("phone")
      .eq("profile_id", other.profileId);

    expect(data).toEqual([{ phone: "010-0000-0007" }]);
  });
});
