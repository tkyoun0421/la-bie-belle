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

describe("findOwnDormancyProfile", () => {
  it("본인 profile 행이 있으면 status·inactivityAnchorAt을 함께 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({
      data: { status: "dormant", inactivity_anchor_at: "2026-01-01T00:00:00Z" },
      error: null,
    });

    const { findOwnDormancyProfile } = await import("@/entities/identity/api/find-own-dormancy");
    const result = await findOwnDormancyProfile();

    expect(result).toEqual({
      ok: true,
      data: { status: "dormant", inactivityAnchorAt: "2026-01-01T00:00:00Z" },
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("status, inactivity_anchor_at");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("본인 profile 행이 없으면 { ok: true, data: null }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { findOwnDormancyProfile } = await import("@/entities/identity/api/find-own-dormancy");
    const result = await findOwnDormancyProfile();

    expect(result).toEqual({ ok: true, data: null });
  });

  it("조회 오류가 있으면 { ok: false, code: COMMON_UNEXPECTED }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    maybeSingle.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { findOwnDormancyProfile } = await import("@/entities/identity/api/find-own-dormancy");
    const result = await findOwnDormancyProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("인증된 사용자가 없으면 { ok: false, code: COMMON_AUTH_REQUIRED }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { findOwnDormancyProfile } = await import("@/entities/identity/api/find-own-dormancy");
    const result = await findOwnDormancyProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(from).not.toHaveBeenCalled();
  });
});
