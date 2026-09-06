import { createBrowserClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupabaseBrowserClient } from "@/shared/lib/create-supabase-browser-client";

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({ auth: {} })),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSupabaseBrowserClient — 필수 env가 없으면 그 자리에서 던진다", () => {
  it("NEXT_PUBLIC_SUPABASE_URL이 undefined면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => createSupabaseBrowserClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("NEXT_PUBLIC_SUPABASE_URL이 빈 문자열이면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => createSupabaseBrowserClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("NEXT_PUBLIC_SUPABASE_ANON_KEY가 undefined면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);

    expect(() => createSupabaseBrowserClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("NEXT_PUBLIC_SUPABASE_ANON_KEY가 빈 문자열이면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => createSupabaseBrowserClient()).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });
});

describe("createSupabaseBrowserClient — 필수 env가 있으면 클라이언트를 만든다", () => {
  it("두 env가 다 있으면 만든 클라이언트를 그대로 돌려준다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const client = createSupabaseBrowserClient();

    expect(client).toEqual({ auth: {} });
  });

  it("env 값을 그대로 라이브러리에 전달한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    createSupabaseBrowserClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "test-anon-key",
    );
  });
});
