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

beforeEach(() => {
  requireAdmin.mockReset();
  requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
  rpc.mockReset();
  revalidatePath.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("copyRequirements", () => {
  it("admin은 copy_schedule_requirements RPC를 호출한다", async () => {
    rpc.mockResolvedValue({ error: null });

    const { copyRequirements } = await import("@/features/requirement/api/copy-requirements");
    const result = await copyRequirements({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("copy_schedule_requirements", {
      target_schedule_id: VALID_SCHEDULE_ID,
    });
    expect(revalidatePath).toHaveBeenCalledOnce();
  });

  it("admin이 아니면 RPC 호출 없이 거부 코드를 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { copyRequirements } = await import("@/features/requirement/api/copy-requirements");
    const result = await copyRequirements({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("CANCELLED 거부(LB020)는 SCHEDULING_STATUS_CONFLICT로 매핑한다", async () => {
    rpc.mockResolvedValue({ error: { code: "LB020", message: "cancelled" } });

    const { copyRequirements } = await import("@/features/requirement/api/copy-requirements");
    const result = await copyRequirements({ scheduleId: VALID_SCHEDULE_ID });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
  });

  it("잘못된 scheduleId는 RPC 호출 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    const { copyRequirements } = await import("@/features/requirement/api/copy-requirements");
    const result = await copyRequirements({ scheduleId: "not-a-uuid" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(rpc).not.toHaveBeenCalled();
  });
});
