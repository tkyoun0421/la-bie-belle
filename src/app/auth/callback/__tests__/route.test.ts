import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const exchangeCodeForSession = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({
  auth: { exchangeCodeForSession },
}));
const findOwnProfile = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("@/entities/identity/api/find-own-profile", () => ({ findOwnProfile }));

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  findOwnProfile.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

function callbackRequest(query: string) {
  return new NextRequest(`http://localhost:3000/auth/callback${query}`);
}

describe("GET /auth/callback", () => {
  it("code가 없으면 /login?error=auth로 리다이렉트한다", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest(""));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("code가 빈 문자열이면 /login?error=auth로 리다이렉트한다", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code="));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("코드 교환이 실패하면 /login?error=auth로 리다이렉트한다", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: { message: "invalid code" } });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
    expect(findOwnProfile).not.toHaveBeenCalled();
  });

  it("같은 코드를 재사용하면 두 번째 요청은 교환 실패 경로로 처리된다", async () => {
    exchangeCodeForSession
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "code already used" } });
    findOwnProfile.mockResolvedValue(true);

    const { GET } = await import("@/app/auth/callback/route");
    const first = await GET(callbackRequest("?code=reused"));
    const second = await GET(callbackRequest("?code=reused"));

    expect(first.headers.get("location")).toBe("http://localhost:3000/");
    expect(second.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
  });

  it("profile이 있으면 홈으로 리다이렉트한다", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    findOwnProfile.mockResolvedValue(true);

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("profile이 없으면 /onboarding으로 리다이렉트한다", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    findOwnProfile.mockResolvedValue(false);

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/onboarding");
  });

  it("profile 조회가 실패하면 /login?error=auth로 리다이렉트한다(fail-closed)", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    findOwnProfile.mockRejectedValue(new Error("boom"));

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
  });
});
