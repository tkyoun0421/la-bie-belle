import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const rpc = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({
  auth: { getUser },
  rpc,
}));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  getUser.mockReset();
  rpc.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("findOwnRoles", () => {
  it("own_effective_roles() RPC 결과를 그대로 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ data: ["worker", "admin"], error: null });

    const { findOwnRoles } = await import("@/entities/identity/api/find-own-roles");
    const result = await findOwnRoles();

    expect(result).toEqual({ ok: true, data: ["worker", "admin"] });
    expect(rpc).toHaveBeenCalledWith("own_effective_roles");
  });

  it("등록되지 않은 값은 걸러내고 등록된 값만 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ data: ["worker", "unknown-role"], error: null });

    const { findOwnRoles } = await import("@/entities/identity/api/find-own-roles");
    const result = await findOwnRoles();

    expect(result).toEqual({ ok: true, data: ["worker"] });
  });

  it("RPC 결과가 없으면 빈 배열을 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ data: null, error: null });

    const { findOwnRoles } = await import("@/entities/identity/api/find-own-roles");
    const result = await findOwnRoles();

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("RPC 오류가 있으면 { ok: false, code: COMMON_UNEXPECTED }를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { findOwnRoles } = await import("@/entities/identity/api/find-own-roles");
    const result = await findOwnRoles();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("RPC 오류가 있으면 개인정보 없이 원인을 관측 가능하게 기록한다", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { findOwnRoles } = await import("@/entities/identity/api/find-own-roles");
    await findOwnRoles();

    expect(stderrWrite).toHaveBeenCalledOnce();
    const logged = String(stderrWrite.mock.calls[0]?.[0] ?? "");
    expect(logged).toContain("57P01");
    expect(logged).not.toContain("user-1");
    expect(logged).not.toContain("boom");
    stderrWrite.mockRestore();
  });

  it("인증된 사용자가 없으면 { ok: false, code: COMMON_AUTH_REQUIRED }를 반환하고 RPC를 호출하지 않는다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { findOwnRoles } = await import("@/entities/identity/api/find-own-roles");
    const result = await findOwnRoles();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(rpc).not.toHaveBeenCalled();
  });
});
