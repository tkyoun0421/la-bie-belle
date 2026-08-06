import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireSuperAdmin = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-super-admin", () => ({ requireSuperAdmin }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  requireSuperAdmin.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("revokeAdmin", () => {
  it("super_admin이면 revoke_admin_role RPC를 호출하고 목록 경로를 재검증한다", async () => {
    requireSuperAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin", "super_admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { revokeAdmin } = await import("@/features/role-management/api/revoke-admin");
    const result = await revokeAdmin("target-1");

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("revoke_admin_role", { target_profile_id: "target-1" });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("super_admin이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireSuperAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { revokeAdmin } = await import("@/features/role-management/api/revoke-admin");
    const result = await revokeAdmin("target-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("RPC 오류가 있으면 COMMON_UNEXPECTED로 거부하고 재검증하지 않는다", async () => {
    requireSuperAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin", "super_admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { revokeAdmin } = await import("@/features/role-management/api/revoke-admin");
    const result = await revokeAdmin("target-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
