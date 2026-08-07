import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";
import { HOME_PATH } from "@/shared/config/auth-routes.config";

vi.mock("server-only", () => ({}));

const getUser = vi.fn();
const rpc = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({
  auth: { getUser },
  rpc,
}));
const redirect = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/cache", () => ({ revalidatePath }));

beforeEach(() => {
  getUser.mockReset();
  rpc.mockReset();
  redirect.mockReset();
  revalidatePath.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("reactivateOwnProfile", () => {
  it("미인증 사용자는 COMMON_AUTH_REQUIRED로 거부되고 rpc가 호출되지 않는다", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const { reactivateOwnProfile } = await import("@/features/reactivation/api/reactivate-own");
    const result = await reactivateOwnProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rpc 성공 시 홈으로 리다이렉트한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ error: null });

    const { reactivateOwnProfile } = await import("@/features/reactivation/api/reactivate-own");
    await reactivateOwnProfile();

    expect(rpc).toHaveBeenCalledWith("reactivate_own_profile");
    expect(redirect).toHaveBeenCalledWith(HOME_PATH);
  });

  it("rpc 실패 시 리다이렉트하지 않고 매핑된 오류 코드를 반환한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ error: { code: "LB011" } });

    const { reactivateOwnProfile } = await import("@/features/reactivation/api/reactivate-own");
    const result = await reactivateOwnProfile();

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_STATUS_CONFLICT });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("rpc 실패 분기에서도 /dormant를 재검증한다", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    rpc.mockResolvedValue({ error: { code: "42501" } });

    const { reactivateOwnProfile } = await import("@/features/reactivation/api/reactivate-own");
    await reactivateOwnProfile();

    expect(revalidatePath).toHaveBeenCalledWith("/dormant");
  });
});
