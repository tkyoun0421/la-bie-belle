import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-admin", () => ({ requireAdmin }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

const VALID_INPUT = {
  name: "김근무",
  phone: "010-1234-5678",
  gender: "male",
  birthDate: "1990-01-01",
};
const TARGET_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  requireAdmin.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateWorkerInfo", () => {
  it("admin이면 정규화된 값으로 update_worker_info RPC를 호출하고 목록·상세를 재검증한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { updateWorkerInfo } =
      await import("@/features/worker-management/api/update-worker-info");
    const result = await updateWorkerInfo(TARGET_ID, VALID_INPUT);

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("update_worker_info", {
      target_profile_id: TARGET_ID,
      new_name: "김근무",
      new_gender: "male",
      new_birth_date: "1990-01-01",
      new_phone: "01012345678",
    });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("admin이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { updateWorkerInfo } =
      await import("@/features/worker-management/api/update-worker-info");
    const result = await updateWorkerInfo(TARGET_ID, VALID_INPUT);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("대상 ID가 UUID 형식이 아니면 RPC 없이 검증 실패를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { updateWorkerInfo } =
      await import("@/features/worker-management/api/update-worker-info");
    const result = await updateWorkerInfo("not-a-uuid", VALID_INPUT);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("입력이 유효하지 않으면 필드 오류와 함께 거부하고 RPC를 호출하지 않는다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { updateWorkerInfo } =
      await import("@/features/worker-management/api/update-worker-info");
    const result = await updateWorkerInfo(TARGET_ID, { ...VALID_INPUT, name: "" });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.code).toBe(ERROR_CODE.IDENTITY_VALIDATION);
    expect(!result.ok && result.fieldErrors?.name).toBeDefined();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("휴대폰 중복이면 IDENTITY_PHONE_TAKEN과 필드 오류를 반환하고 재검증한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "profiles_phone_key"',
      },
    });

    const { updateWorkerInfo } =
      await import("@/features/worker-management/api/update-worker-info");
    const result = await updateWorkerInfo(TARGET_ID, VALID_INPUT);

    expect(result).toEqual({
      ok: false,
      code: ERROR_CODE.IDENTITY_PHONE_TAKEN,
      fieldErrors: { phone: ERROR_CODES.IDENTITY_PHONE_TAKEN.message },
    });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("예상하지 못한 RPC 오류는 COMMON_UNEXPECTED로 거부하되 재검증은 수행한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { updateWorkerInfo } =
      await import("@/features/worker-management/api/update-worker-info");
    const result = await updateWorkerInfo(TARGET_ID, VALID_INPUT);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });
});
