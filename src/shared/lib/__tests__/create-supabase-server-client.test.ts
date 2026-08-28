import { createServerClient } from "@supabase/ssr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/shared/lib/create-supabase-server-client";

type CookieAdapter = {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: {
      name: string;
      value: string;
      options: Record<string, unknown>;
    }[],
    headers: Record<string, string>,
  ) => void;
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({ auth: {} })),
}));

function capturedCookieAdapter(): CookieAdapter {
  const calls = vi.mocked(createServerClient).mock.calls;
  const [, , options] = calls[calls.length - 1];

  return (options as { cookies: CookieAdapter }).cookies;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSupabaseServerClient — Next 쿠키 저장소를 @supabase/ssr 형식으로 잇는다", () => {
  it("쿠키 저장소의 getAll 결과를 라이브러리에 그대로 전달한다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const sampleCookies = [{ name: "sb-access-token", value: "abc" }];
    const cookieStore = {
      getAll: () => sampleCookies,
      set: vi.fn(),
    };

    createSupabaseServerClient(cookieStore);

    expect(capturedCookieAdapter().getAll()).toEqual(sampleCookies);
  });

  it("Server Component처럼 쿠키를 못 쓰는 자리에서 set이 던져도 밖으로 새지 않는다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const cookieStore = {
      getAll: () => [],
      set: () => {
        throw new Error(
          "Cookies can only be modified in a Server Action or Route Handler",
        );
      },
    };

    createSupabaseServerClient(cookieStore);

    expect(() =>
      capturedCookieAdapter().setAll(
        [{ name: "sb-access-token", value: "refreshed", options: {} }],
        {},
      ),
    ).not.toThrow();
  });
});

describe("createSupabaseServerClient — 필수 env가 없으면 그 자리에서 던진다", () => {
  const minimalCookieStore = {
    getAll: () => [],
    set: vi.fn(),
  };

  it("NEXT_PUBLIC_SUPABASE_URL이 undefined면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => createSupabaseServerClient(minimalCookieStore)).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("NEXT_PUBLIC_SUPABASE_URL이 빈 문자열이면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    expect(() => createSupabaseServerClient(minimalCookieStore)).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("NEXT_PUBLIC_SUPABASE_ANON_KEY가 undefined면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);

    expect(() => createSupabaseServerClient(minimalCookieStore)).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });

  it("NEXT_PUBLIC_SUPABASE_ANON_KEY가 빈 문자열이면 던진다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => createSupabaseServerClient(minimalCookieStore)).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  });
});

describe("createSupabaseServerClient — 쿠키 쓰기가 실패해도 헤더 전달은 막히지 않는다 (지금 이 조합을 쓰는 실제 호출자는 없다, 방어적 배선을 고정해 둔다)", () => {
  it("set이 던져도 setHeader는 넘어온 헤더마다 불린다", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");

    const capturedHeaders: Record<string, string> = {};
    const cookieStore = {
      getAll: () => [],
      set: () => {
        throw new Error(
          "Cookies can only be modified in a Server Action or Route Handler",
        );
      },
      setHeader: (name: string, value: string) => {
        capturedHeaders[name] = value;
      },
    };

    createSupabaseServerClient(cookieStore);

    capturedCookieAdapter().setAll(
      [{ name: "sb-access-token", value: "refreshed", options: {} }],
      {
        "x-cache-control-sample-1": "no-store",
        "x-cache-control-sample-2": "no-store",
      },
    );

    expect(capturedHeaders).toEqual({
      "x-cache-control-sample-1": "no-store",
      "x-cache-control-sample-2": "no-store",
    });
  });
});
