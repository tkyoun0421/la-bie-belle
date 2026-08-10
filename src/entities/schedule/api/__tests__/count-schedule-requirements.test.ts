import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const eq = vi.fn();
const select = vi.fn(() => ({ eq }));
const from = vi.fn((table: string) => {
  if (table === "schedule_position_requirements") {
    return { select };
  }
  throw new Error(`unexpected table ${table}`);
});

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  eq.mockReset();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("countScheduleRequirements", () => {
  it("스케줄의 필요 인원 행 개수를 센다", async () => {
    eq.mockResolvedValue({ count: 9, error: null });

    const { countScheduleRequirements } =
      await import("@/entities/schedule/api/count-schedule-requirements");
    const result = await countScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: true, count: 9 });
    expect(from).toHaveBeenCalledWith("schedule_position_requirements");
    expect(select).toHaveBeenCalledWith("position_id", { count: "exact", head: true });
    expect(eq).toHaveBeenCalledWith("schedule_id", "schedule-1");
  });

  it("행이 없으면 0을 반환한다", async () => {
    eq.mockResolvedValue({ count: 0, error: null });

    const { countScheduleRequirements } =
      await import("@/entities/schedule/api/count-schedule-requirements");
    const result = await countScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: true, count: 0 });
  });

  it("count가 null이면 0으로 취급한다", async () => {
    eq.mockResolvedValue({ count: null, error: null });

    const { countScheduleRequirements } =
      await import("@/entities/schedule/api/count-schedule-requirements");
    const result = await countScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: true, count: 0 });
  });

  it("42501은 IDENTITY_NOT_ACTIVE로 매핑한다", async () => {
    eq.mockResolvedValue({ count: null, error: { code: "42501", message: "denied" } });

    const { countScheduleRequirements } =
      await import("@/entities/schedule/api/count-schedule-requirements");
    const result = await countScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 조회 오류는 COMMON_UNEXPECTED로 매핑한다", async () => {
    eq.mockResolvedValue({ count: null, error: { code: "57P01", message: "boom" } });

    const { countScheduleRequirements } =
      await import("@/entities/schedule/api/count-schedule-requirements");
    const result = await countScheduleRequirements("schedule-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
