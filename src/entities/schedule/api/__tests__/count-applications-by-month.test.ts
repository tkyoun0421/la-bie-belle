import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const range = vi.fn();
const order = vi.fn(() => ({ range }));
const inFilter = vi.fn(() => ({ order }));
const eq = vi.fn(() => ({ in: inFilter }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  range.mockReset();
  order.mockClear();
  inFilter.mockClear();
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
    range.mockResolvedValue({
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
    expect(order).toHaveBeenCalledWith("id", { ascending: true });
    expect(result).toEqual({
      ok: true,
      data: [
        { scheduleId: "schedule-1", count: 2 },
        { scheduleId: "schedule-2", count: 1 },
      ],
    });
  });

  it("신청이 0건인 스케줄은 결과에 나타나지 않는다(0건은 항목 부재로 표현)", async () => {
    range.mockResolvedValue({ data: [], error: null });

    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({ scheduleIds: ["schedule-1"] });

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    range.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({ scheduleIds: ["schedule-1"] });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("응답이 페이지 크기 경계를 넘으면 range 페이지네이션으로 전체 페이지를 순회해 정확히 집계한다", async () => {
    range.mockImplementation((from: number) => {
      if (from === 0) {
        return Promise.resolve({
          data: [{ schedule_id: "schedule-1" }, { schedule_id: "schedule-1" }],
          error: null,
        });
      }
      if (from === 2) {
        return Promise.resolve({ data: [{ schedule_id: "schedule-2" }], error: null });
      }
      throw new Error(`예상하지 못한 range 호출: from=${from}`);
    });

    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({
      scheduleIds: ["schedule-1", "schedule-2"],
      pageSize: 2,
    });

    expect(range).toHaveBeenCalledTimes(2);
    expect(range).toHaveBeenNthCalledWith(1, 0, 1);
    expect(range).toHaveBeenNthCalledWith(2, 2, 3);
    expect(result).toEqual({
      ok: true,
      data: [
        { scheduleId: "schedule-1", count: 2 },
        { scheduleId: "schedule-2", count: 1 },
      ],
    });
  });

  it("응답 행 수가 페이지 크기의 정확한 배수여도 다음 페이지가 빌 때까지 확인해 절단 없이 종료한다", async () => {
    range.mockImplementation((from: number) => {
      if (from === 0) {
        return Promise.resolve({
          data: [{ schedule_id: "schedule-1" }, { schedule_id: "schedule-1" }],
          error: null,
        });
      }
      if (from === 2) {
        return Promise.resolve({ data: [], error: null });
      }
      throw new Error(`예상하지 못한 range 호출: from=${from}`);
    });

    const { countApplicationsByMonth } =
      await import("@/entities/schedule/api/count-applications-by-month");
    const result = await countApplicationsByMonth({
      scheduleIds: ["schedule-1"],
      pageSize: 2,
    });

    expect(range).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ok: true, data: [{ scheduleId: "schedule-1", count: 2 }] });
  });
});
