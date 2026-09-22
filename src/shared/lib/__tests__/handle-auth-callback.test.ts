import type { SupabaseClient } from "@supabase/supabase-js";
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

describe("handleAuthCallback — code 유무와 교환 결과만 알리고 목적지는 판정하지 않는다", () => {
  it("code 파라미터가 없으면 missing_code 실패를 돌려준다", async () => {
    const client = fakeClient({ error: null });

    const result = await handleAuthCallback(null, client);

    expect(result).toEqual({ ok: false, reason: "missing_code" });
  });

  it("exchangeCodeForSession이 실패하면 exchange_failed 실패를 돌려준다", async () => {
    const client = fakeClient({ error: { message: "invalid_grant" } });

    const result = await handleAuthCallback("auth-code", client);

    expect(result).toEqual({ ok: false, reason: "exchange_failed" });
  });

  it("exchangeCodeForSession이 성공하면 성공만 알리고 목적지 문자열을 담지 않는다", async () => {
    const client = fakeClient({ error: null });

    const result = await handleAuthCallback("auth-code", client);

    expect(result).toEqual({ ok: true });
  });
});
