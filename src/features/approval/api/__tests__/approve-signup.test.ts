import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-admin", () => ({ requireAdmin }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  requireAdmin.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("approveSignup", () => {
  it("admin이면 approve_signup RPC를 호출하고 목록 경로를 재검증한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { approveSignup } = await import("@/features/approval/api/approve-signup");
    const result = await approveSignup("target-1");

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("approve_signup", { target: "target-1" });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { approveSignup } = await import("@/features/approval/api/approve-signup");
    const result = await approveSignup("target-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("이미 처리된 신청이면 IDENTITY_ALREADY_PROCESSED로 거부하고 재검증하지 않는다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "22023", message: "not pending" } });

    const { approveSignup } = await import("@/features/approval/api/approve-signup");
    const result = await approveSignup("target-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_ALREADY_PROCESSED });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("예상하지 못한 RPC 오류는 COMMON_UNEXPECTED로 거부한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { approveSignup } = await import("@/features/approval/api/approve-signup");
    const result = await approveSignup("target-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
