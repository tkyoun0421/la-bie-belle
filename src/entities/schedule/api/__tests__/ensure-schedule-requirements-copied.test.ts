import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const rpc = vi.fn();
const createSupabaseServerClient = vi.fn(async () => ({ rpc }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

const VALID_SCHEDULE_ID = "11111111-1111-4111-8111-111111111111";

beforeEach(() => {
  rpc.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ensureScheduleRequirementsCopied", () => {
  it("copy_schedule_requirements RPC를 스케줄 id로 호출한다", async () => {
    rpc.mockResolvedValue({ error: null });

    const { ensureScheduleRequirementsCopied } =
      await import("@/entities/schedule/api/ensure-schedule-requirements-copied");
    const result = await ensureScheduleRequirementsCopied(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("copy_schedule_requirements", {
      target_schedule_id: VALID_SCHEDULE_ID,
    });
  });

  it("CANCELLED 거부(LB020)는 SCHEDULING_STATUS_CONFLICT로 매핑한다", async () => {
    rpc.mockResolvedValue({ error: { code: "LB020", message: "cancelled" } });

    const { ensureScheduleRequirementsCopied } =
      await import("@/entities/schedule/api/ensure-schedule-requirements-copied");
    const result = await ensureScheduleRequirementsCopied(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_STATUS_CONFLICT });
  });

  it("권한 없음(42501)은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    rpc.mockResolvedValue({ error: { code: "42501", message: "forbidden" } });

    const { ensureScheduleRequirementsCopied } =
      await import("@/entities/schedule/api/ensure-schedule-requirements-copied");
    const result = await ensureScheduleRequirementsCopied(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 에러는 COMMON_UNEXPECTED로 매핑한다", async () => {
    rpc.mockResolvedValue({ error: { code: "57P01", message: "connection lost" } });

    const { ensureScheduleRequirementsCopied } =
      await import("@/entities/schedule/api/ensure-schedule-requirements-copied");
    const result = await ensureScheduleRequirementsCopied(VALID_SCHEDULE_ID);

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
