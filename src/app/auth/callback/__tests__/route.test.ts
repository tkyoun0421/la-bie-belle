import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

const exchangeCodeForSession = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({
  auth: { exchangeCodeForSession },
}));
const findOwnProfile = vi.fn();
const bootstrapSuperAdmin = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("@/entities/identity/api/find-own-profile", () => ({ findOwnProfile }));
vi.mock("@/entities/identity/api/bootstrap-super-admin", () => ({ bootstrapSuperAdmin }));

beforeEach(() => {
  exchangeCodeForSession.mockReset();
  findOwnProfile.mockReset();
  bootstrapSuperAdmin.mockReset();
  bootstrapSuperAdmin.mockResolvedValue({ ok: true, active: false });
});

afterEach(() => {
  vi.clearAllMocks();
});

function callbackRequest(query: string) {
  return new NextRequest(`http://localhost:3000/auth/callback${query}`);
}

function exchangeSuccess(userId: string, email = "user@labiebelle.test") {
  return { data: { user: { id: userId, email }, session: {} }, error: null };
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
    expect(bootstrapSuperAdmin).not.toHaveBeenCalled();
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

  it("코드 교환 성공 시 교환된 사용자 이메일로 bootstrapSuperAdmin을 먼저 호출한 뒤 findOwnProfile을 조회한다", async () => {
    exchangeCodeForSession.mockResolvedValue(
      exchangeSuccess("user-1", "super-admin@labiebelle.test"),
    );
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "active" } });

    const { GET } = await import("@/app/auth/callback/route");
    await GET(callbackRequest("?code=abc"));

    expect(bootstrapSuperAdmin).toHaveBeenCalledWith("super-admin@labiebelle.test");
    const bootstrapOrder = bootstrapSuperAdmin.mock.invocationCallOrder[0] ?? 0;
    const findOwnProfileOrder = findOwnProfile.mock.invocationCallOrder[0] ?? 0;
    expect(bootstrapOrder).toBeLessThan(findOwnProfileOrder);
  });

  it("bootstrap RPC가 실패해도(ok:false) 기존 흐름대로 계속 진행한다", async () => {
    exchangeCodeForSession.mockResolvedValue(exchangeSuccess("user-1"));
    findOwnProfile.mockResolvedValue({ ok: true, data: { status: "pending" } });
    bootstrapSuperAdmin.mockResolvedValue({ ok: false });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/pending");
  });

  it("비일치 이메일이면 bootstrapSuperAdmin이 무동작(ok:true, active:false)이고 기존 분기가 그대로 유지된다", async () => {
    exchangeCodeForSession.mockResolvedValue(
      exchangeSuccess("user-1", "someone-else@labiebelle.test"),
    );
    findOwnProfile.mockResolvedValue({ ok: true, data: null });

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(callbackRequest("?code=abc"));

    expect(bootstrapSuperAdmin).toHaveBeenCalledWith("someone-else@labiebelle.test");
    expect(response.headers.get("location")).toBe("http://localhost:3000/onboarding");
  });
});
