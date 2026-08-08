import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const eqStatus = vi.fn();
const eqScheduleId = vi.fn(() => ({ eq: eqStatus }));
const select = vi.fn(() => ({ eq: eqScheduleId }));
const from = vi.fn(() => ({ select }));

const createSupabaseServerClient = vi.fn(async () => ({ from }));

vi.mock("@/shared/lib/supabase-server", () => ({ createSupabaseServerClient }));

beforeEach(() => {
  eqStatus.mockReset();
  eqScheduleId.mockClear();
  select.mockClear();
  from.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listApplicantsBySchedule", () => {
  it("schedule_id와 applied 상태로 필터해 조회한다", async () => {
    eqStatus.mockResolvedValue({
      data: [{ profiles: { name: "김민준" } }],
      error: null,
    });

    const { listApplicantsBySchedule } =
      await import("@/entities/schedule/api/list-applicants-by-schedule");
    const result = await listApplicantsBySchedule({ scheduleId: "schedule-1" });

    expect(from).toHaveBeenCalledWith("applications");
    expect(eqScheduleId).toHaveBeenCalledWith("schedule_id", "schedule-1");
    expect(eqStatus).toHaveBeenCalledWith("status", "applied");
    expect(result).toEqual({ ok: true, data: [{ name: "김민준" }] });
  });

  it("신청자가 없으면 빈 배열을 반환한다", async () => {
    eqStatus.mockResolvedValue({ data: [], error: null });

    const { listApplicantsBySchedule } =
      await import("@/entities/schedule/api/list-applicants-by-schedule");
    const result = await listApplicantsBySchedule({ scheduleId: "schedule-1" });

    expect(result).toEqual({ ok: true, data: [] });
  });

  it("동명이인은 그대로 각각의 항목으로 반환한다", async () => {
    eqStatus.mockResolvedValue({
      data: [{ profiles: { name: "김민준" } }, { profiles: { name: "김민준" } }],
      error: null,
    });

    const { listApplicantsBySchedule } =
      await import("@/entities/schedule/api/list-applicants-by-schedule");
    const result = await listApplicantsBySchedule({ scheduleId: "schedule-1" });

    expect(result).toEqual({ ok: true, data: [{ name: "김민준" }, { name: "김민준" }] });
  });

  it("조회 오류(42501)는 IDENTITY_NOT_ACTIVE를 반환한다", async () => {
    eqStatus.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const { listApplicantsBySchedule } =
      await import("@/entities/schedule/api/list-applicants-by-schedule");
    const result = await listApplicantsBySchedule({ scheduleId: "schedule-1" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });

  it("그 외 조회 오류는 COMMON_UNEXPECTED를 반환한다", async () => {
    eqStatus.mockResolvedValue({ data: null, error: { code: "57P01", message: "boom" } });

    const { listApplicantsBySchedule } =
      await import("@/entities/schedule/api/list-applicants-by-schedule");
    const result = await listApplicantsBySchedule({ scheduleId: "schedule-1" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_UNEXPECTED });
  });
});
