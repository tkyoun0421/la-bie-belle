import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { handleAuthCallback } from "@/shared/lib/handle-auth-callback";

function fakeClient(exchangeResult: {
  error: { message: string } | null;
}): SupabaseClient {
  return {
    auth: {
      exchangeCodeForSession: async () => exchangeResult,
    },
  } as unknown as SupabaseClient;
}

describe("handleAuthCallback — code 유무와 교환 결과로 목적지를 가른다", () => {
  it("code 파라미터가 없으면 로그인 화면으로 보낸다", async () => {
    const client = fakeClient({ error: null });

    const destination = await handleAuthCallback(null, client);

    expect(destination).toBe("/login");
  });

  it("exchangeCodeForSession이 실패하면 로그인 화면으로 보낸다", async () => {
    const client = fakeClient({ error: { message: "invalid_grant" } });

    const destination = await handleAuthCallback("auth-code", client);

    expect(destination).toBe("/login");
  });

  it("exchangeCodeForSession이 성공하면 홈으로 보낸다", async () => {
    const client = fakeClient({ error: null });

    const destination = await handleAuthCallback("auth-code", client);

    expect(destination).toBe("/");
  });
});
