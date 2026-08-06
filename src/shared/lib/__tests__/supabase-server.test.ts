import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  getAll: vi.fn(() => [{ name: "sb-access-token", value: "fixture" }]),
  set: vi.fn(),
};

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));
vi.mock("@/shared/config/env.server", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key-fixture",
  },
}));

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
      return { auth: {}, from: vi.fn() };
    },
  ),
}));

beforeEach(() => {
  capturedCookies = null;
  cookieStore.getAll.mockClear();
  cookieStore.set.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createSupabaseServerClient", () => {
  it("next/headers cookies()로 얻은 store를 getAll에 위임한다", async () => {
    const { createSupabaseServerClient } = await import("@/shared/lib/supabase-server");
    const client = await createSupabaseServerClient();

    expect(client.auth).toBeDefined();
    expect(typeof client.from).toBe("function");
    expect(capturedCookies).not.toBeNull();

    const all = capturedCookies?.getAll();
    expect(all).toEqual([{ name: "sb-access-token", value: "fixture" }]);
  });

  it("setAll이 각 쿠키를 cookieStore.set으로 위임한다", async () => {
    const { createSupabaseServerClient } = await import("@/shared/lib/supabase-server");
    await createSupabaseServerClient();

    capturedCookies?.setAll([
      { name: "a", value: "1", options: { path: "/" } },
      { name: "b", value: "2", options: { path: "/" } },
    ]);

    expect(cookieStore.set).toHaveBeenNthCalledWith(1, "a", "1", { path: "/" });
    expect(cookieStore.set).toHaveBeenNthCalledWith(2, "b", "2", { path: "/" });
  });

  it("Server Component 렌더 중 set이 던지는 오류를 삼킨다", async () => {
    cookieStore.set.mockImplementationOnce(() => {
      throw new Error("Server Component에서 cookies().set 호출 불가");
    });
    const { createSupabaseServerClient } = await import("@/shared/lib/supabase-server");
    await createSupabaseServerClient();

    expect(() => capturedCookies?.setAll([{ name: "a", value: "1", options: {} }])).not.toThrow();
  });
});
