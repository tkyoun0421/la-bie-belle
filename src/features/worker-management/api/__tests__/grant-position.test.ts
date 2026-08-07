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

const TARGET_ID = "11111111-1111-4111-8111-111111111111";
const POSITION_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  requireAdmin.mockReset();
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("grantPosition", () => {
  it("admin이면 grant_position_eligibility RPC를 호출하고 상세를 재검증한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: null });

    const { grantPosition } = await import("@/features/worker-management/api/grant-position");
    const result = await grantPosition(TARGET_ID, POSITION_ID);

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("grant_position_eligibility", {
      target_profile_id: TARGET_ID,
      target_position_id: POSITION_ID,
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 RPC를 호출하지 않고 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { grantPosition } = await import("@/features/worker-management/api/grant-position");
    const result = await grantPosition(TARGET_ID, POSITION_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("ID가 UUID가 아니면 RPC 없이 검증 실패를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { grantPosition } = await import("@/features/worker-management/api/grant-position");
    const result = await grantPosition("not-a-uuid", POSITION_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("비활성 포지션 부여 시도는 매핑된 코드로 거부하되 재검증은 수행한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    rpc.mockResolvedValue({ data: null, error: { code: "LB002", message: "inactive" } });

    const { grantPosition } = await import("@/features/worker-management/api/grant-position");
    const result = await grantPosition(TARGET_ID, POSITION_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_VALIDATION });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });
});
