import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";
import { HOURLY_WAGE_MIN } from "@/shared/config/wage.config";

vi.mock("server-only", () => ({}));

const requireActiveProfile = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();
const getUser = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc, auth: { getUser } }));

vi.mock("@/entities/identity/api/require-active-profile", () => ({ requireActiveProfile }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  requireActiveProfile.mockReset();
  requireActiveProfile.mockResolvedValue({ ok: true, profile: { status: "active" } });
  rpc.mockReset();
  revalidatePath.mockClear();
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: { id: "worker-1" } } });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("setOwnWage", () => {
  it("활성 프로필이면 본인 id를 대상으로 set_hourly_wage RPC를 호출하고 내 정보를 재검증한다", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    const { setOwnWage } = await import("@/features/my-profile/api/set-own-wage");
    const result = await setOwnWage(15000);

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("set_hourly_wage", {
      target_profile_id: "worker-1",
      new_wage: 15000,
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("활성 프로필이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireActiveProfile.mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });

    const { setOwnWage } = await import("@/features/my-profile/api/set-own-wage");
    const result = await setOwnWage(15000);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("로그인 사용자를 찾지 못하면 RPC 없이 COMMON_AUTH_REQUIRED를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const { setOwnWage } = await import("@/features/my-profile/api/set-own-wage");
    const result = await setOwnWage(15000);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(rpc).not.toHaveBeenCalled();
  });

  it(`시급이 ${HOURLY_WAGE_MIN}원 미만이면 필드 오류를 반환하고 RPC를 호출하지 않는다`, async () => {
    const { setOwnWage } = await import("@/features/my-profile/api/set-own-wage");
    const result = await setOwnWage(0);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.code).toBe(ERROR_CODE.IDENTITY_VALIDATION);
    expect(!result.ok && result.fieldErrors?.hourlyWage).toBeDefined();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC 오류는 매핑된 코드로 거부하되 재검증은 수행한다", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "LB001", message: "out of range" } });

    const { setOwnWage } = await import("@/features/my-profile/api/set-own-wage");
    const result = await setOwnWage(15000);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_VALIDATION });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});
