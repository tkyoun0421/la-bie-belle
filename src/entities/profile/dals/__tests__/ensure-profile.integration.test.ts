import { ensureProfile } from "@/entities/profile/dals/ensure-profile";
import { createSignedInUserWithoutProfile } from "@tests/integration/supabase";

describe("ensure_profile", () => {
  it("처음 부르면 행이 생긴다", async () => {
    const { client, userId } = await createSignedInUserWithoutProfile();

    await ensureProfile(client);

    const { data } = await client
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId);

    expect(data).toEqual([{ user_id: userId }]);
  });

  it("두 번 불러도 행이 하나다", async () => {
    const { client, userId } = await createSignedInUserWithoutProfile();

    await ensureProfile(client);
    await ensureProfile(client);

    const { data } = await client
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId);

    expect(data).toHaveLength(1);
  });

  it("다른 사람이 부르면 그 사람 행이 따로 생긴다", async () => {
    const a = await createSignedInUserWithoutProfile();
    const b = await createSignedInUserWithoutProfile();

    await ensureProfile(a.client);
    await ensureProfile(b.client);

    const { data: aData } = await a.client
      .from("profiles")
      .select("user_id")
      .eq("user_id", a.userId);
    const { data: bData } = await b.client
      .from("profiles")
      .select("user_id")
      .eq("user_id", b.userId);

    expect(aData).toEqual([{ user_id: a.userId }]);
    expect(bData).toEqual([{ user_id: b.userId }]);
  });
});
