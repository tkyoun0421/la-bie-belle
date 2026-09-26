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

  it("공백뿐인 이름은 invalid_name으로 거절된다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "   ",
      phone: "010-0000-0004",
      birth_date: "1990-01-01",
      gender: "female",
    });

    expect(error?.message).toBe("invalid_name");
  });

  it("female·male 밖의 성별은 invalid_gender로 거절된다", async () => {
    const user = await createSignedInUser();

    const { error } = await user.client.rpc("submit_profile", {
      display_name: "다희",
      phone: "010-0000-0005",
      birth_date: "1990-01-01",
      gender: "기타",
    });

    expect(error?.message).toBe("invalid_gender");
  });
});
