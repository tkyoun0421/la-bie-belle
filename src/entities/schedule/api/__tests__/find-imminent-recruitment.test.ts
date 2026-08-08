import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const limit = vi.fn();
const order = vi.fn(() => ({ limit }));
const gte = vi.fn(() => ({ order }));
const eq = vi.fn(() => ({ gte }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));
const listOwnApplications = vi.fn();

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));
vi.mock("@/entities/schedule/api/list-own-applications", () => ({ listOwnApplications }));

beforeEach(() => {
  limit.mockReset();
  order.mockClear();
  gte.mockClear();
  eq.mockClear();
  select.mockClear();
  from.mockClear();
  listOwnApplications.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("findImminentRecruitment", () => {
  it("OPEN이고 오늘 이후 마감인 스케줄을 마감일 오름차순으로 조회한다", async () => {
    limit.mockResolvedValue({ data: [], error: null });

    const { findImminentRecruitment } =
      await import("@/entities/schedule/api/find-imminent-recruitment");
    const result = await findImminentRecruitment({ today: "2026-08-09" });

    expect(from).toHaveBeenCalledWith("schedules");
    expect(select).toHaveBeenCalledWith("id, work_date, application_deadline");
    expect(eq).toHaveBeenCalledWith("status", "OPEN");
    expect(gte).toHaveBeenCalledWith("application_deadline", "2026-08-09");
    expect(order).toHaveBeenCalledWith("application_deadline", { ascending: true });
    expect(result).toEqual({ ok: true, data: [] });
    expect(listOwnApplications).not.toHaveBeenCalled();
  });

  it("후보가 있으면 본인 신청 상태를 함께 조회해 applied 여부를 붙인다", async () => {
    limit.mockResolvedValue({
      data: [
        { id: "schedule-1", work_date: "2026-08-10", application_deadline: "2026-08-09" },
        { id: "schedule-2", work_date: "2026-08-11", application_deadline: "2026-08-10" },
      ],
      error: null,
    });
    listOwnApplications.mockResolvedValue({
      ok: true,
      data: [{ scheduleId: "schedule-1", status: "applied" }],
    });

    const { findImminentRecruitment } =
      await import("@/entities/schedule/api/find-imminent-recruitment");
    const result = await findImminentRecruitment({ today: "2026-08-09" });

    expect(listOwnApplications).toHaveBeenCalledWith({
      scheduleIds: ["schedule-1", "schedule-2"],
    });
    expect(result).toEqual({
      ok: true,
      data: [
        {
          scheduleId: "schedule-1",
          workDate: "2026-08-10",
          applicationDeadline: "2026-08-09",
          applied: true,
        },
        {
          scheduleId: "schedule-2",
          workDate: "2026-08-11",
          applicationDeadline: "2026-08-10",
          applied: false,
        },
      ],
    });
  });

  it("스케줄 조회 오류가 있으면 COMMON_UNEXPECTED를 반환한다", async () => {
    limit.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { findImminentRecruitment } =
      await import("@/entities/schedule/api/find-imminent-recruitment");
    const result = await findImminentRecruitment({ today: "2026-08-09" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });

  it("본인 신청 조회가 실패하면 그 실패 코드를 그대로 전달한다", async () => {
    limit.mockResolvedValue({
      data: [{ id: "schedule-1", work_date: "2026-08-10", application_deadline: "2026-08-09" }],
      error: null,
    });
    listOwnApplications.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });

    const { findImminentRecruitment } =
      await import("@/entities/schedule/api/find-imminent-recruitment");
    const result = await findImminentRecruitment({ today: "2026-08-09" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_AUTH_REQUIRED });
  });
});
