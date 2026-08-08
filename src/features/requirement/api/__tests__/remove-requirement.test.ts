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

const VALID_SCHEDULE_ID = "11111111-1111-4111-8111-111111111111";
const VALID_POSITION_ID = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("removeRequirement", () => {
  it("admin은 remove_position_requirement RPC를 호출한다", async () => {
    rpc.mockResolvedValue({ error: null });

    const { removeRequirement } = await import("@/features/requirement/api/remove-requirement");
    const result = await removeRequirement({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
    });

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("remove_position_requirement", {
      target_schedule_id: VALID_SCHEDULE_ID,
      target_position_id: VALID_POSITION_ID,
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("CONFIRMED 거부(LB020)는 SCHEDULING_STATUS_CONFLICT로 매핑한다", async () => {
    rpc.mockResolvedValue({ error: { code: "LB020", message: "confirmed" } });

    const { removeRequirement } = await import("@/features/requirement/api/remove-requirement");
    const result = await removeRequirement({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
  });

  it("admin이 아니면 RPC 호출 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { removeRequirement } = await import("@/features/requirement/api/remove-requirement");
    const result = await removeRequirement({
      scheduleId: VALID_SCHEDULE_ID,
      positionId: VALID_POSITION_ID,
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });
});
