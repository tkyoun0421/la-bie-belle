import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";
import { HOURLY_WAGE_MAX } from "@/shared/config/wage.config";

vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-admin", () => ({ requireAdmin }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

const TARGET_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  requireAdmin.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("setHourlyWage", () => {
  it("admin이면 set_hourly_wage RPC를 호출하고 목록·상세를 재검증한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { setHourlyWage } = await import("@/features/worker-management/api/set-hourly-wage");
    const result = await setHourlyWage(TARGET_ID, 15000);

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("set_hourly_wage", {
      target_profile_id: TARGET_ID,
      new_wage: 15000,
    });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });

  it("admin이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { setHourlyWage } = await import("@/features/worker-management/api/set-hourly-wage");
    const result = await setHourlyWage(TARGET_ID, 15000);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("대상 ID가 UUID가 아니면 RPC 없이 검증 실패를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { setHourlyWage } = await import("@/features/worker-management/api/set-hourly-wage");
    const result = await setHourlyWage("not-a-uuid", 15000);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("시급이 범위를 벗어나면 필드 오류를 반환하고 RPC를 호출하지 않는다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { setHourlyWage } = await import("@/features/worker-management/api/set-hourly-wage");
    const result = await setHourlyWage(TARGET_ID, HOURLY_WAGE_MAX + 1);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.code).toBe(ERROR_CODE.IDENTITY_VALIDATION);
    expect(!result.ok && result.fieldErrors?.hourlyWage).toBeDefined();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC 오류는 매핑된 코드로 거부하되 재검증은 수행한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "LB001", message: "out of range" } });

    const { setHourlyWage } = await import("@/features/worker-management/api/set-hourly-wage");
    const result = await setHourlyWage(TARGET_ID, 15000);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_VALIDATION });
    expect(revalidatePath).toHaveBeenCalledTimes(2);
  });
});
