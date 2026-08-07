import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const order = vi.fn();
const lte = vi.fn(() => ({ order }));
const gte = vi.fn(() => ({ lte }));
const select = vi.fn(() => ({ gte }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  order.mockReset();
  lte.mockClear();
  gte.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listRecruitmentSchedules", () => {
  it("월의 시작일·종료일 범위로 schedules를 조회한다", async () => {
    order.mockResolvedValue({
      data: [
        {
          id: "schedule-1",
          work_date: "2099-09-01",
          application_deadline: "2099-09-01",
          status: "OPEN",
        },
      ],
      error: null,
    });

    const { listRecruitmentSchedules } =
      await import("@/entities/schedule/api/list-recruitment-schedules");
    const result = await listRecruitmentSchedules({ month: new Date(2099, 8, 15) });

    expect(from).toHaveBeenCalledWith("schedules");
    expect(select).toHaveBeenCalledWith("id, work_date, application_deadline, status");
    expect(gte).toHaveBeenCalledWith("work_date", "2099-09-01");
    expect(lte).toHaveBeenCalledWith("work_date", "2099-09-30");
    expect(order).toHaveBeenCalledWith("work_date", { ascending: true });
    expect(result).toEqual({
      ok: true,
      data: [
        {
          id: "schedule-1",
          workDate: "2099-09-01",
          applicationDeadline: "2099-09-01",
          status: "OPEN",
        },
      ],
    });
  });

  it("데이터가 없으면 빈 배열을 반환한다", async () => {
    order.mockResolvedValue({ data: null, error: null });

    const { listRecruitmentSchedules } =
      await import("@/entities/schedule/api/list-recruitment-schedules");
    const result = await listRecruitmentSchedules({ month: new Date(2099, 0, 1) });

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    order.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listRecruitmentSchedules } =
      await import("@/entities/schedule/api/list-recruitment-schedules");
    const result = await listRecruitmentSchedules({ month: new Date(2099, 0, 1) });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
