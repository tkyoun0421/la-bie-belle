import "server-only";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/config/env.server", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key-fixture",
  },
}));

import { createSupabaseServerClient } from "@/shared/api/supabase-server";

describe("createSupabaseServerClient", () => {
  it("env.server의 URL·anon key로 Supabase client를 만든다", () => {
    const client = createSupabaseServerClient();
    expect(client.auth).toBeDefined();
    expect(typeof client.from).toBe("function");
  });

  it("호출마다 새 client 인스턴스를 만든다", () => {
    const first = createSupabaseServerClient();
    const second = createSupabaseServerClient();
    expect(first).not.toBe(second);
  });
});
