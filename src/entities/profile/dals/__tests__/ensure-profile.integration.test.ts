import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createGuestClient } from "@tests/integration/supabase";

async function signUpWithoutProfile() {
  const email = `${randomUUID()}@example.com`;
  const password = randomUUID();
  const client = createGuestClient();

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error(`가입은 됐는데 사용자가 없다: ${email}`);
  }

  return { client, userId: data.user.id };
}

describe("ensure_profile", () => {
  it("처음 부르면 행이 생긴다", async () => {
    const { client, userId } = await signUpWithoutProfile();

    const { error } = await client.rpc("ensure_profile");
    expect(error).toBeNull();

    const { data } = await client
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId);

    expect(data).toEqual([{ user_id: userId }]);
  });

  it("두 번 불러도 행이 하나다", async () => {
    const { client, userId } = await signUpWithoutProfile();

    await client.rpc("ensure_profile");
    await client.rpc("ensure_profile");

    const { data } = await client
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId);

    expect(data).toHaveLength(1);
  });

  it("다른 사람이 부르면 그 사람 행이 따로 생긴다", async () => {
    const a = await signUpWithoutProfile();
    const b = await signUpWithoutProfile();

    await a.client.rpc("ensure_profile");
    await b.client.rpc("ensure_profile");

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
