import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config/env.client", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key-fixture",
  },
}));

import { createSupabaseBrowserClient } from "./supabase-browser";

describe("createSupabaseBrowserClient", () => {
  it("env.client의 URL·anon key로 Supabase client를 만든다", () => {
    const client = createSupabaseBrowserClient();
    expect(client.auth).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
