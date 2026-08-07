import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE, ERROR_CODES } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireActiveProfile = vi.fn();
const rpc = vi.fn();
const revalidatePath = vi.fn();

const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/entities/identity/api/require-active-profile", () => ({ requireActiveProfile }));
vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  requireActiveProfile.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("updateOwnPhone", () => {
  it("활성 프로필이면 정규화된 번호로 update_own_phone RPC를 호출하고 내 정보를 재검증한다", async () => {
    requireActiveProfile.mockResolvedValue({ ok: true, profile: { status: "active" } });
    rpc.mockResolvedValue({ data: null, error: null });

    const { updateOwnPhone } = await import("@/features/my-profile/api/update-own-phone");
    const result = await updateOwnPhone("010-9999-8888");

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("update_own_phone", { new_phone: "01099998888" });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("활성 프로필이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireActiveProfile.mockResolvedValue({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });

    const { updateOwnPhone } = await import("@/features/my-profile/api/update-own-phone");
    const result = await updateOwnPhone("01099998888");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("형식이 올바르지 않으면 필드 오류와 함께 거부하고 RPC를 호출하지 않는다", async () => {
    requireActiveProfile.mockResolvedValue({ ok: true, profile: { status: "active" } });

    const { updateOwnPhone } = await import("@/features/my-profile/api/update-own-phone");
    const result = await updateOwnPhone("02-1234-5678");

    expect(result.ok).toBe(false);
    expect(!result.ok && result.code).toBe(ERROR_CODE.IDENTITY_VALIDATION);
    expect(!result.ok && result.fieldErrors?.phone).toBeDefined();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("휴대폰 중복이면 IDENTITY_PHONE_TAKEN과 필드 오류를 반환하고 재검증한다", async () => {
    requireActiveProfile.mockResolvedValue({ ok: true, profile: { status: "active" } });
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: "23505",
        message: 'duplicate key value violates unique constraint "profiles_phone_key"',
      },
    });

    const { updateOwnPhone } = await import("@/features/my-profile/api/update-own-phone");
    const result = await updateOwnPhone("01099998888");

    expect(result).toEqual({
      ok: false,
      code: ERROR_CODE.IDENTITY_PHONE_TAKEN,
      fieldErrors: { phone: ERROR_CODES.IDENTITY_PHONE_TAKEN.message },
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});
