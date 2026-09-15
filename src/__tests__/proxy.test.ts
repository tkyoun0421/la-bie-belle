import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isStaticAssetPath, proxy } from "@/proxy";

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

const { REFRESHED_COOKIE, REFRESHED_HEADER, getUserMock } = vi.hoisted(() => ({
  REFRESHED_COOKIE: { name: "sb-access-token", value: "refreshed-token-value" },
  REFRESHED_HEADER: {
    name: "x-sample-cache-control",
    value: "no-store-sample",
  },
  getUserMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(
    (_url: string, _key: string, options: ServerClientOptions) => ({
      auth: {
        getUser: async () => {
          options.cookies.setAll([{ ...REFRESHED_COOKIE, options: {} }], {
            [REFRESHED_HEADER.name]: REFRESHED_HEADER.value,
          });
          return getUserMock();
        },
      },
    }),
  ),
}));

function fakeUser() {
  return { id: "user-1", email: "person@example.com", user_metadata: {} };
}

function noSession() {
  return { data: { user: null }, error: null };
}

function withSession() {
  return { data: { user: fakeUser() }, error: null };
}

function request(pathname: string): NextRequest {
  return new NextRequest(`http://localhost:3000${pathname}`);
}

function stubSupabaseEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
}

describe("proxy — 정적 자원 경로를 건너뛴다", () => {
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

describe("proxy — 세션 쿠키를 갱신한다", () => {
  beforeEach(() => {
    stubSupabaseEnv();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue(withSession());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("getUser 호출 중 setAll로 넘긴 쿠키가 실제 응답 쿠키에 실린다", async () => {
    const response = await proxy(request("/mypage"));

    expect(response.cookies.get(REFRESHED_COOKIE.name)?.value).toBe(
      REFRESHED_COOKIE.value,
    );
  });

  it("setAll 둘째 인자로 받은 헤더가 실제 응답 헤더에 실린다", async () => {
    const response = await proxy(request("/mypage"));

    expect(response.headers.get(REFRESHED_HEADER.name)).toBe(
      REFRESHED_HEADER.value,
    );
  });
});

describe("proxy — 로그인·콜백·로그아웃 경로는 세션이 없어도 통과한다", () => {
  beforeEach(() => {
    stubSupabaseEnv();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue(noSession());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("세션이 없어도 /login은 리다이렉트 없이 통과한다", async () => {
    const response = await proxy(request("/login"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("세션이 없어도 /auth/callback은 리다이렉트 없이 통과한다", async () => {
    const response = await proxy(request("/auth/callback"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("세션이 없어도 /auth/logout은 리다이렉트 없이 통과한다", async () => {
    const response = await proxy(request("/auth/logout"));

    expect(response.headers.get("location")).toBeNull();
  });
});

describe("proxy — 세션이 없으면 보호된 경로를 로그인으로 보낸다", () => {
  beforeEach(() => {
    stubSupabaseEnv();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue(noSession());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("루트 경로를 열면 /login으로 리다이렉트한다", async () => {
    const response = await proxy(request("/"));

    expect(response.headers.get("location")).toContain("/login");
    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
  });

  it("/pending을 열면 /login으로 리다이렉트한다", async () => {
    const response = await proxy(request("/pending"));

    expect(response.headers.get("location")).toContain("/login");
  });

  it("/mypage를 열면 /login으로 리다이렉트한다", async () => {
    const response = await proxy(request("/mypage"));

    expect(response.headers.get("location")).toContain("/login");
  });
});

describe("proxy — 세션이 있으면 어느 경로든 통과시킨다", () => {
  beforeEach(() => {
    stubSupabaseEnv();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue(withSession());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("세션이 있으면 보호된 경로를 리다이렉트 없이 통과시킨다", async () => {
    const response = await proxy(request("/"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("세션이 있으면 /login도 리다이렉트 없이 통과시킨다", async () => {
    const response = await proxy(request("/login"));

    expect(response.headers.get("location")).toBeNull();
  });
});
