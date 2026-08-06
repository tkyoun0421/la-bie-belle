import "server-only";

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/shared/config/env.server", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key-fixture",
  },
}));

const getUser = vi.fn();

let capturedCookies: {
  getAll: () => unknown;
  setAll: (
    cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>,
  ) => void;
} | null = null;

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(
    (_url: string, _key: string, options: { cookies: typeof capturedCookies }) => {
      capturedCookies = options.cookies;
      return { auth: { getUser } };
    },
  ),
}));

beforeEach(() => {
  capturedCookies = null;
  getUser.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateSupabaseSession", () => {
  it("인증된 사용자면 isAuthenticated가 true다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const { updateSupabaseSession } = await import("@/shared/lib/supabase-proxy-session");
    const request = new NextRequest("http://localhost:3000/schedule");

    const result = await updateSupabaseSession(request);

    expect(result.isAuthenticated).toBe(true);
    expect(result.response).toBeDefined();
  });

  it("인증되지 않은 사용자면 isAuthenticated가 false다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { updateSupabaseSession } = await import("@/shared/lib/supabase-proxy-session");
    const request = new NextRequest("http://localhost:3000/schedule");

    const result = await updateSupabaseSession(request);

    expect(result.isAuthenticated).toBe(false);
  });

  it("요청 쿠키를 getAll에 위임한다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { updateSupabaseSession } = await import("@/shared/lib/supabase-proxy-session");
    const request = new NextRequest("http://localhost:3000/schedule", {
      headers: { cookie: "sb-access-token=fixture" },
    });

    await updateSupabaseSession(request);

    expect(capturedCookies?.getAll()).toEqual([{ name: "sb-access-token", value: "fixture" }]);
  });

  it("getUser 처리 중 세션이 갱신되면 반환하는 response에 새 쿠키가 반영된다", async () => {
    getUser.mockImplementation(async () => {
      capturedCookies?.setAll([
        { name: "sb-access-token", value: "refreshed", options: { path: "/" } },
      ]);
      return { data: { user: { id: "user-1" } }, error: null };
    });
    const { updateSupabaseSession } = await import("@/shared/lib/supabase-proxy-session");
    const request = new NextRequest("http://localhost:3000/schedule");

    const result = await updateSupabaseSession(request);

    expect(result.response.cookies.get("sb-access-token")?.value).toBe("refreshed");
  });
});
