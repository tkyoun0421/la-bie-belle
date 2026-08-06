import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REJECT_REASON_MAX_LENGTH } from "@/entities/identity/model/approval";
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

describe("rejectSignup", () => {
  it("admin이면 사유를 다듬어 reject_signup RPC를 호출하고 목록 경로를 재검증한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { rejectSignup } = await import("@/features/approval/api/reject-signup");
    const result = await rejectSignup("target-1", "  부적절한 서류  ");

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("reject_signup", {
      target: "target-1",
      reason: "부적절한 서류",
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("사유를 생략하면 reason에 null을 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { rejectSignup } = await import("@/features/approval/api/reject-signup");
    await rejectSignup("target-1");

    expect(rpc).toHaveBeenCalledWith("reject_signup", { target: "target-1", reason: null });
  });

  it("admin이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { rejectSignup } = await import("@/features/approval/api/reject-signup");
    const result = await rejectSignup("target-1", "사유");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("사유가 최대 길이를 넘으면 검증 실패로 거부하고 RPC를 호출하지 않는다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { rejectSignup } = await import("@/features/approval/api/reject-signup");
    const result = await rejectSignup("target-1", "가".repeat(REJECT_REASON_MAX_LENGTH + 1));

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("이미 처리된 신청이면 IDENTITY_ALREADY_PROCESSED로 거부한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "22023", message: "not pending" } });

    const { rejectSignup } = await import("@/features/approval/api/reject-signup");
    const result = await rejectSignup("target-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_ALREADY_PROCESSED });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("예상하지 못한 RPC 오류는 COMMON_UNEXPECTED로 거부한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { rejectSignup } = await import("@/features/approval/api/reject-signup");
    const result = await rejectSignup("target-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
