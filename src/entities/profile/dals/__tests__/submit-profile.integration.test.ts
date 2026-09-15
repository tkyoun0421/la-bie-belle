import { describe, expect, it } from "vitest";
import { isDomainError } from "@/shared/api/errors";
import { submitProfile } from "@/entities/profile/dals/submit-profile";
import { createAdminUser } from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

describe("submit_profile", () => {
  it("제출하면 display_name과 submitted_at과 profile_private 행이 같이 찬다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0001",
      birth_date: "1990-01-01",
      gender: "female",
    });

    expect(error).toBeNull();

    const { data: profile } = await user.client
      .from("profiles")
      .select("display_name, submitted_at")
      .eq("id", user.profileId)
      .single<{ display_name: string | null; submitted_at: string | null }>();

    expect(profile?.display_name).toBe("다희");
    expect(profile?.submitted_at).not.toBeNull();

    const { data: privateRow } = await user.client
      .from("profile_private")
      .select("phone, birth_date, gender")
      .eq("profile_id", user.profileId)
      .single();

    expect(privateRow).toEqual({
      phone: "010-0000-0001",
      birth_date: "1990-01-01",
      gender: "female",
    });
  });

  it("두 번째 제출은 already_submitted로 막힌다", async () => {
    const user = await createSignedInUser();
    await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0002",
      birth_date: "1990-01-01",
      gender: "female",
    });

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희2",
      phone: "010-0000-0002",
      birth_date: "1990-01-01",
      gender: "female",
    });

    expect(error?.message).toBe("already_submitted");
  });

  it("거절된 뒤에는 다시 제출된다", async () => {
    const user = await createSignedInUser();
    await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0003",
      birth_date: "1990-01-01",
      gender: "female",
    });

    const admin = await createAdminUser();
    await admin.client.rpc("reject_member", { profile_id: user.profileId });

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0003",
      birth_date: "1990-01-01",
      gender: "female",
    });

    expect(error).toBeNull();
  });

  it("gender가 female·male이 아니면 invalid_gender로 막힌다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0004",
      birth_date: "1990-01-01",
      gender: "other",
    });

    expect(error?.message).toBe("invalid_gender");
  });

  it.each(["01012345678", "011-1234-5678"])(
    "phone이 010 11자리 꼴이 아니면(%s) invalid_phone으로 막힌다",
    async (phone) => {
      const user = await createSignedInUser();

      const { error } = await user.client.rpc("submit_profile", {
        display_name: "다희",
        phone,
        birth_date: "1990-01-01",
        gender: "female",
      });

      expect(error?.message).toBe("invalid_phone");
    },
  );
});

describe("submitProfile dal", () => {
  it("제출하면 profiles와 profile_private에 넘긴 값이 남는다", async () => {
    const user = await createSignedInUser();

    await submitProfile(user.client, {
      displayName: "테스트 이름",
      phone: "010-0000-0011",
      birthDate: "1993-04-21",
      gender: "female",
    });

    const { data: profile } = await user.client
      .from("profiles")
      .select("display_name, submitted_at")
      .eq("id", user.profileId)
      .single<{ display_name: string | null; submitted_at: string | null }>();

    expect(profile?.display_name).toBe("테스트 이름");
    expect(profile?.submitted_at).not.toBeNull();

    const { data: privateRow } = await user.client
      .from("profile_private")
      .select("phone, birth_date, gender")
      .eq("profile_id", user.profileId)
      .single();

    expect(privateRow).toEqual({
      phone: "010-0000-0011",
      birth_date: "1993-04-21",
      gender: "female",
    });
  });

  it("두 번째 제출은 DomainError(already_submitted)로 reject된다", async () => {
    const user = await createSignedInUser();
    const input = {
      displayName: "테스트 이름",
      phone: "010-0000-0012",
      birthDate: "1993-04-21",
      gender: "female" as const,
    };

    await submitProfile(user.client, input);

    let caught: unknown;
    try {
      await submitProfile(user.client, input);
    } catch (e) {
      caught = e;
    }

    expect(isDomainError(caught, "already_submitted")).toBe(true);
  });
});
