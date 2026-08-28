import { createServerClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";
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

describe("createSupabaseServerClient — Next 쿠키 저장소를 @supabase/ssr 형식으로 잇는다", () => {
  it("쿠키 저장소의 getAll 결과를 라이브러리에 그대로 전달한다", () => {
    const sampleCookies = [{ name: "sb-access-token", value: "abc" }];
    const cookieStore = {
      getAll: () => sampleCookies,
      set: vi.fn(),
    };

    createSupabaseServerClient(cookieStore);

    expect(capturedCookieAdapter().getAll()).toEqual(sampleCookies);
  });

  it("Server Component처럼 쿠키를 못 쓰는 자리에서 set이 던져도 밖으로 새지 않는다", () => {
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
