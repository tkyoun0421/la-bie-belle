import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isStaticAssetPath, middleware } from "@/middleware";

type SetAllCookies = (
  cookies: { name: string; value: string; options: Record<string, unknown> }[],
  headers: Record<string, string>,
) => void;

type ServerClientOptions = {
  cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: SetAllCookies;
  };
};

const { REFRESHED_COOKIE, REFRESHED_HEADER } = vi.hoisted(() => ({
  REFRESHED_COOKIE: { name: "sb-access-token", value: "refreshed-token-value" },
  REFRESHED_HEADER: {
    name: "x-sample-cache-control",
    value: "no-store-sample",
  },
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(
    (_url: string, _key: string, options: ServerClientOptions) => ({
      auth: {
        getUser: async () => {
          options.cookies.setAll([{ ...REFRESHED_COOKIE, options: {} }], {
            [REFRESHED_HEADER.name]: REFRESHED_HEADER.value,
          });
          return { data: { user: null }, error: null };
        },
      },
    }),
  ),
}));

describe("미들웨어 — 갱신된 쿠키를 응답에 심는다", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getUser 호출 중 setAll로 넘긴 쿠키가 실제 NextResponse 쿠키에 실린다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    const request = new NextRequest("http://localhost:3000/mypage");

    const response = await middleware(request);

    expect(response.cookies.get(REFRESHED_COOKIE.name)?.value).toBe(
      REFRESHED_COOKIE.value,
    );
  });

  it("setAll 둘째 인자로 받은 헤더가 실제 NextResponse 헤더에 실린다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    const request = new NextRequest("http://localhost:3000/mypage");

    const response = await middleware(request);

    expect(response.headers.get(REFRESHED_HEADER.name)).toBe(
      REFRESHED_HEADER.value,
    );
  });
});

describe("미들웨어 — 정적 자원 경로를 건너뛴다", () => {
  it("_next/static 경로는 건너뛴다", () => {
    expect(isStaticAssetPath("/_next/static/chunks/main.js")).toBe(true);
  });

  it("_next/image 경로는 건너뛴다", () => {
    expect(isStaticAssetPath("/_next/image")).toBe(true);
  });

  it("파비콘 경로는 건너뛴다", () => {
    expect(isStaticAssetPath("/favicon.ico")).toBe(true);
  });

  it("이미지 확장자가 붙은 경로는 건너뛴다", () => {
    expect(isStaticAssetPath("/hero.png")).toBe(true);
    expect(isStaticAssetPath("/gallery/photo.jpg")).toBe(true);
  });

  it("일반 화면 경로는 안 건너뛴다", () => {
    expect(isStaticAssetPath("/")).toBe(false);
    expect(isStaticAssetPath("/mypage")).toBe(false);
  });

  it("_next/static 을 흉내낸 일반 라우트는 안 건너뛴다", () => {
    expect(isStaticAssetPath("/articles/_next/static-guide")).toBe(false);
  });
});
