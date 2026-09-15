import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createGuestClient } from "@tests/integration/supabase";

async function signUpWithoutProfile() {
  const email = `${randomUUID()}@example.com`;
  const password = randomUUID();
  const client = createGuestClient();

  const { error } = await client.auth.signUp({ email, password });
  if (error) {
    throw error;
  }

  return client;
}

describe("is_approved · is_admin", () => {
  it("세션 없이 부르면 거짓이다", async () => {
    const guest = createGuestClient();

    const { data: approved, error: approvedError } =
      await guest.rpc("is_approved");
    const { data: admin, error: adminError } = await guest.rpc("is_admin");

    expect(approvedError).toBeNull();
    expect(adminError).toBeNull();
    expect(approved).toBe(false);
    expect(admin).toBe(false);
  });

  it("프로필이 없으면 거짓이다", async () => {
    const client = await signUpWithoutProfile();

    const { data: approved, error: approvedError } =
      await client.rpc("is_approved");
    const { data: admin, error: adminError } = await client.rpc("is_admin");

    expect(approvedError).toBeNull();
    expect(adminError).toBeNull();
    expect(approved).toBe(false);
    expect(admin).toBe(false);
  });
});
