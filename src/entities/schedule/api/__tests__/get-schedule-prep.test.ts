import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const scheduleMaybeSingle = vi.fn();
const scheduleEq = vi.fn(() => ({ maybeSingle: scheduleMaybeSingle }));
const scheduleSelect = vi.fn(() => ({ eq: scheduleEq }));

const ceremoniesOrder = vi.fn();
const ceremoniesEq = vi.fn(() => ({ order: ceremoniesOrder }));
const ceremoniesSelect = vi.fn(() => ({ eq: ceremoniesEq }));

const rulesOrder = vi.fn();
const rulesSelect = vi.fn(() => ({ order: rulesOrder }));

const from = vi.fn((table: string) => {
  if (table === "schedules") {
    return { select: scheduleSelect };
  }
  if (table === "ceremonies") {
    return { select: ceremoniesSelect };
  }
  if (table === "check_in_rules") {
    return { select: rulesSelect };
  }
  throw new Error(`unexpected table ${table}`);
});

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  scheduleMaybeSingle.mockReset();
  scheduleEq.mockClear();
  scheduleSelect.mockClear();
  ceremoniesOrder.mockReset();
  ceremoniesEq.mockClear();
  ceremoniesSelect.mockClear();
  rulesOrder.mockReset();
  rulesSelect.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getSchedulePrep", () => {
  it("스케줄·예식·예정 시각·규칙표를 한 번에 조회해 분 단위로 정규화한다", async () => {
    scheduleMaybeSingle.mockResolvedValue({
      data: {
        id: "sched-1",
        work_date: "2099-11-01",
        status: "OPEN",
        planned_checkin: "08:20:00",
        planned_checkout: "15:30:00",
      },
      error: null,
    });
    ceremoniesOrder.mockResolvedValue({
      data: [{ starts_at: "10:00:00" }, { starts_at: "11:00:00" }],
      error: null,
    });
    rulesOrder.mockResolvedValue({
      data: [
        { first_ceremony_at: "10:00:00", recommended_check_in: "08:20:00" },
        { first_ceremony_at: "11:00:00", recommended_check_in: "09:10:00" },
      ],
      error: null,
    });

    const { getSchedulePrep } = await import("@/entities/schedule/api/get-schedule-prep");
    const result = await getSchedulePrep("sched-1");

    expect(result).toEqual({
      ok: true,
      data: {
        id: "sched-1",
        workDate: "2099-11-01",
        status: "OPEN",
        ceremonyTimes: ["10:00", "11:00"],
        plannedCheckin: "08:20",
        plannedCheckout: "15:30",
        checkInRules: [
          { firstCeremonyAt: "10:00", recommendedCheckIn: "08:20" },
          { firstCeremonyAt: "11:00", recommendedCheckIn: "09:10" },
        ],
      },
    });
    expect(scheduleSelect).toHaveBeenCalledWith(
      "id, work_date, status, planned_checkin, planned_checkout",
    );
    expect(scheduleEq).toHaveBeenCalledWith("id", "sched-1");
    expect(ceremoniesEq).toHaveBeenCalledWith("schedule_id", "sched-1");
    expect(ceremoniesOrder).toHaveBeenCalledWith("starts_at", { ascending: true });
    expect(rulesOrder).toHaveBeenCalledWith("first_ceremony_at", { ascending: true });
  });

  it("예정 시각이 아직 없으면 null을 유지한다", async () => {
    scheduleMaybeSingle.mockResolvedValue({
      data: {
        id: "sched-2",
        work_date: "2099-11-02",
        status: "PREPARING",
        planned_checkin: null,
        planned_checkout: null,
      },
      error: null,
    });
    ceremoniesOrder.mockResolvedValue({ data: [], error: null });
    rulesOrder.mockResolvedValue({ data: [], error: null });

    const { getSchedulePrep } = await import("@/entities/schedule/api/get-schedule-prep");
    const result = await getSchedulePrep("sched-2");

    expect(result.ok).toBe(true);
    expect(result.ok && result.data?.plannedCheckin).toBeNull();
    expect(result.ok && result.data?.plannedCheckout).toBeNull();
    expect(result.ok && result.data?.ceremonyTimes).toEqual([]);
  });

  it("대상 스케줄이 없으면 data: null을 반환한다", async () => {
    scheduleMaybeSingle.mockResolvedValue({ data: null, error: null });
    ceremoniesOrder.mockResolvedValue({ data: [], error: null });
    rulesOrder.mockResolvedValue({ data: [], error: null });

    const { getSchedulePrep } = await import("@/entities/schedule/api/get-schedule-prep");
    const result = await getSchedulePrep("missing");

    expect(result).toEqual({ ok: true, data: null });
  });

  it("조회 오류(42501)는 IDENTITY_NOT_ACTIVE를 반환한다", async () => {
    scheduleMaybeSingle.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "forbidden" },
    });
    ceremoniesOrder.mockResolvedValue({ data: [], error: null });
    rulesOrder.mockResolvedValue({ data: [], error: null });

    const { getSchedulePrep } = await import("@/entities/schedule/api/get-schedule-prep");
    const result = await getSchedulePrep("sched-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 조회 오류는 COMMON_UNEXPECTED를 반환한다", async () => {
    scheduleMaybeSingle.mockResolvedValue({
      data: {
        id: "sched-1",
        work_date: "2099-11-01",
        status: "OPEN",
        planned_checkin: null,
        planned_checkout: null,
      },
      error: null,
    });
    ceremoniesOrder.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });
    rulesOrder.mockResolvedValue({ data: [], error: null });

    const { getSchedulePrep } = await import("@/entities/schedule/api/get-schedule-prep");
    const result = await getSchedulePrep("sched-1");

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
