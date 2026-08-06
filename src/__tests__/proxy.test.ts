import { NextRequest, NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const updateSupabaseSession = vi.fn();
const resolveAuthRedirect = vi.fn();

vi.mock("@/shared/lib/supabase-proxy-session", () => ({ updateSupabaseSession }));
vi.mock("@/shared/lib/route-access", () => ({ resolveAuthRedirect }));

afterEach(() => {
  vi.clearAllMocks();
});

describe("proxy", () => {
  it("resolveAuthRedirect가 null이면 세션 갱신 response를 그대로 반환한다", async () => {
    const passthrough = NextResponse.next();
    updateSupabaseSession.mockResolvedValue({ response: passthrough, isAuthenticated: true });
    resolveAuthRedirect.mockReturnValue(null);

    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/schedule");

    const response = await proxy(request);

    expect(response).toBe(passthrough);
    expect(resolveAuthRedirect).toHaveBeenCalledWith("/schedule", true);
  });

  it("resolveAuthRedirect가 경로를 반환하면 그 경로로 redirect한다", async () => {
    updateSupabaseSession.mockResolvedValue({
      response: NextResponse.next(),
      isAuthenticated: false,
    });
    resolveAuthRedirect.mockReturnValue("/login");

    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/schedule");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  });

  it("redirect할 때 세션 갱신 response의 쿠키를 redirect response로 옮긴다", async () => {
    const sessionResponse = NextResponse.next();
    sessionResponse.cookies.set("sb-127-auth-token", "refreshed-value", { path: "/" });
    updateSupabaseSession.mockResolvedValue({ response: sessionResponse, isAuthenticated: false });
    resolveAuthRedirect.mockReturnValue("/login");

    const { proxy } = await import("@/proxy");
    const request = new NextRequest("http://localhost:3000/schedule");

    const response = await proxy(request);

    expect(response.cookies.get("sb-127-auth-token")?.value).toBe("refreshed-value");
  });
});
