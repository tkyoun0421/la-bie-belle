import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const inFilter = vi.fn();
const eq = vi.fn(() => ({ in: inFilter }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  inFilter.mockReset();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("countApplicationsByMonth", () => {
  it("scheduleIds가 비어 있으면 조회 없이 빈 배열을 반환한다", async () => {
    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({ scheduleIds: [] });

    expect(result).toEqual({ ok: true, data: [] });
    expect(from).not.toHaveBeenCalled();
  });

  it("applied 상태의 신청을 schedule_id별로 집계한다", async () => {
    inFilter.mockResolvedValue({
      data: [
        { schedule_id: "schedule-1" },
        { schedule_id: "schedule-1" },
        { schedule_id: "schedule-2" },
      ],
      error: null,
    });

    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({
      scheduleIds: ["schedule-1", "schedule-2", "schedule-3"],
    });

    expect(from).toHaveBeenCalledWith("applications");
    expect(select).toHaveBeenCalledWith("schedule_id");
    expect(eq).toHaveBeenCalledWith("status", "applied");
    expect(inFilter).toHaveBeenCalledWith("schedule_id", [
      "schedule-1",
      "schedule-2",
      "schedule-3",
    ]);
    expect(result).toEqual({
      ok: true,
      data: [
        { scheduleId: "schedule-1", count: 2 },
        { scheduleId: "schedule-2", count: 1 },
      ],
    });
  });

  it("신청이 0건인 스케줄은 결과에 나타나지 않는다(0건은 항목 부재로 표현)", async () => {
    inFilter.mockResolvedValue({ data: [], error: null });

    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({ scheduleIds: ["schedule-1"] });

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    inFilter.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({ scheduleIds: ["schedule-1"] });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
