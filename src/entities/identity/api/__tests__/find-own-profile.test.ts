import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({
  auth: { getUser },
  from,
}));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  getUser.mockReset();
  maybeSingle.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("findOwnProfile", () => {
  it("본인 profile 행이 있으면 { ok: true, data: { status } }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: { status: "pending" }, error: null });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    const result = await findOwnProfile();

    expect(result).toEqual({ ok: true, data: { status: "pending" } });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("status");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("본인 profile 행이 없으면 { ok: true, data: null }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    const result = await findOwnProfile();

    expect(result).toEqual({ ok: true, data: null });
  });

  it("조회 오류가 있으면 { ok: false, code: COMMON_UNEXPECTED }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    const result = await findOwnProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("조회 오류가 있으면 개인정보 없이 원인을 관측 가능하게 기록한다", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    await findOwnProfile();

    expect(stderrWrite).toHaveBeenCalledOnce();
    const logged = String(stderrWrite.mock.calls[0]?.[0] ?? "");
    expect(logged).toContain("57P01");
    expect(logged).not.toContain("user-1");
    expect(logged).not.toContain("boom");
    stderrWrite.mockRestore();
  });

  it("인증된 사용자가 없으면 { ok: false, code: COMMON_AUTH_REQUIRED }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    const result = await findOwnProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(from).not.toHaveBeenCalled();
  });

  it("userId를 인자로 받으면 getUser()를 호출하지 않고 그 id로 바로 조회한다", async () => {
    maybeSingle.mockResolvedValue({ data: { status: "active" }, error: null });

    const { findOwnProfile } = await import("@/entities/identity/api/find-own-profile");
    const result = await findOwnProfile("user-2");

    expect(result).toEqual({ ok: true, data: { status: "active" } });
    expect(getUser).not.toHaveBeenCalled();
    expect(eq).toHaveBeenCalledWith("id", "user-2");
  });
});
