import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

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

function exchangeSuccess(userId: string) {
  return { data: { user: { id: userId }, session: {} }, error: null };
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
    exchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "invalid code" },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
    expect(findOwnProfile).not.toHaveBeenCalled();
  });

  it("같은 코드를 재사용하면 두 번째 요청은 교환 실패 경로로 처리된다", async () => {
    exchangeCodeForSession.mockResolvedValueOnce(exchangeSuccess("user-1")).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: "code already used" },
    });
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "active" } });

    const { GET } = await import("@/app/auth/callback/route");
    const first = await GET(callbackRequest("?code=reused"));
    const second = await GET(callbackRequest("?code=reused"));

    expect(first.headers.get("location")).toBe("http://localhost:3000/");
    expect(second.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
  });

  it("active profile이면 홈으로 리다이렉트하고 교환된 user.id로 findOwnProfile을 호출한다(중복 getUser 없음)", async () => {
    exchangeCodeForSession.mockResolvedValue(exchangeSuccess("user-1"));
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "active" } });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/");
    expect(findOwnProfile).toHaveBeenCalledWith("user-1");
  });

  it("profile이 없으면 /onboarding으로 리다이렉트한다", async () => {
    exchangeCodeForSession.mockResolvedValue(exchangeSuccess("user-1"));
    findOwnProfile.mockResolvedValue({ ok: true, data: null });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/onboarding");
  });

  it("pending profile이면 /pending으로 리다이렉트한다", async () => {
    exchangeCodeForSession.mockResolvedValue(exchangeSuccess("user-1"));
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "pending" } });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/pending");
  });

  it("profile 조회가 실패하면 /login?error=auth로 리다이렉트한다(fail-closed)", async () => {
    exchangeCodeForSession.mockResolvedValue(exchangeSuccess("user-1"));
    findOwnProfile.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=auth");
  });
});
