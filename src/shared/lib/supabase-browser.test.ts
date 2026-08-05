import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "local-anon-key-fixture");
  vi.stubEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", "local-vapid-public-fixture");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSupabaseBrowserClient", () => {
  it("실제 env.client 모듈 로드·Zod 파싱 경로로 Supabase client를 만든다", async () => {
    const { createSupabaseBrowserClient } = await import("./supabase-browser");
    const client = createSupabaseBrowserClient();
    expect(client.auth).toBeDefined();
    expect(typeof client.from).toBe("function");
  });

  it("필수 NEXT_PUBLIC 값이 없으면 모듈 초기화가 그 키 이름을 담아 실패한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    await expect(import("./supabase-browser")).rejects.toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
