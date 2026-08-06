import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const order = vi.fn();
const eq = vi.fn(() => ({ order }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  order.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listActiveProfilesWithRoles", () => {
  it("active 프로필과 부여 역할을 조인해 worker를 포함한 역할 목록으로 반환한다", async () => {
    order.mockResolvedValue({
      data: [
        { id: "profile-1", name: "홍길동", profile_roles: [{ role: "admin" }] },
        { id: "profile-2", name: "김영희", profile_roles: [] },
      ],
      error: null,
    });

    const { listActiveProfilesWithRoles } =
      await import("@/entities/identity/api/list-active-profiles-with-roles");
    const result = await listActiveProfilesWithRoles();

    expect(result).toEqual({
      ok: true,
      data: [
        { id: "profile-1", name: "홍길동", roles: ["worker", "admin"] },
        { id: "profile-2", name: "김영희", roles: ["worker"] },
      ],
    });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith(
      "id, name, profile_roles!profile_roles_profile_id_fkey(role)",
    );
    expect(eq).toHaveBeenCalledWith("status", "active");
  });

  it("결과가 없으면 빈 배열을 반환한다", async () => {
    order.mockResolvedValue({ data: [], error: null });

    const { listActiveProfilesWithRoles } =
      await import("@/entities/identity/api/list-active-profiles-with-roles");
    const result = await listActiveProfilesWithRoles();

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("조회 오류가 있으면 { ok: false, code: COMMON_UNEXPECTED }를 반환한다", async () => {
    order.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listActiveProfilesWithRoles } =
      await import("@/entities/identity/api/list-active-profiles-with-roles");
    const result = await listActiveProfilesWithRoles();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("조회 오류가 있으면 개인정보 없이 원인을 관측 가능하게 기록한다", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    order.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listActiveProfilesWithRoles } =
      await import("@/entities/identity/api/list-active-profiles-with-roles");
    await listActiveProfilesWithRoles();

    expect(stderrWrite).toHaveBeenCalledOnce();
    const logged = String(stderrWrite.mock.calls[0]?.[0] ?? "");
    expect(logged).toContain("57P01");
    expect(logged).not.toContain("boom");
    stderrWrite.mockRestore();
  });
});
