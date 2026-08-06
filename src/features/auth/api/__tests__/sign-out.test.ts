import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const signOutMock = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({
  auth: { signOut: signOutMock },
}));
const redirect = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/navigation", () => ({ redirect }));

beforeEach(() => {
  signOutMock.mockReset();
  redirect.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("signOut", () => {
  it("성공하면 /login으로 redirect한다", async () => {
    signOutMock.mockResolvedValue({ error: null });

    const { signOut } = await import("@/features/auth/api/sign-out");
    await signOut();

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("이미 로그아웃된 상태의 재호출도 오류 없이 /login으로 redirect한다", async () => {
    signOutMock.mockResolvedValue({ error: null });

    const { signOut } = await import("@/features/auth/api/sign-out");
    await signOut();
    await signOut();

    expect(redirect).toHaveBeenCalledTimes(2);
    expect(redirect).toHaveBeenNthCalledWith(1, "/login");
    expect(redirect).toHaveBeenNthCalledWith(2, "/login");
  });

  it("실패하면 redirect하지 않고 실패 결과를 반환한다", async () => {
    signOutMock.mockResolvedValue({ error: { message: "boom" } });

    const { signOut } = await import("@/features/auth/api/sign-out");
    const result = await signOut();

    expect(redirect).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false });
  });
});
