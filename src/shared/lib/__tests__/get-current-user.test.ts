import type { SupabaseClient, User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { getCurrentUser } from "@/shared/lib/get-current-user";

function fakeClient(getUserResult: {
  data: { user: User | null };
  error: { message: string } | null;
}): SupabaseClient {
  return {
    auth: {
      getUser: async () => getUserResult,
    },
  } as unknown as SupabaseClient;
}

const FAKE_USER = { id: "user-1", email: "person@example.com" } as User;

describe("getCurrentUser — 지금 로그인한 사람을 읽는다", () => {
  it("Auth가 사람을 돌려주면 그 사람을 그대로 돌려준다", async () => {
    const client = fakeClient({ data: { user: FAKE_USER }, error: null });

    const result = await getCurrentUser(client);

    expect(result).toEqual(FAKE_USER);
  });

  it("Auth가 사람 없이 돌아오면 빈 값을 돌려준다", async () => {
    const client = fakeClient({ data: { user: null }, error: null });

    const result = await getCurrentUser(client);

    expect(result).toBeNull();
  });

  it("Auth가 에러를 돌려주면 빈 값을 돌려준다", async () => {
    const client = fakeClient({
      data: { user: null },
      error: { message: "invalid token" },
    });

    const result = await getCurrentUser(client);

    expect(result).toBeNull();
  });
});
