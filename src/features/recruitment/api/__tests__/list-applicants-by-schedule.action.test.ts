import "server-only";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ERROR_CODE } from "@/shared/config/error-codes.config";

vi.mock("server-only", () => ({}));

const requireAdmin = vi.fn();
const listApplicantsBySchedule = vi.fn();

vi.mock("@/entities/identity/api/require-admin", () => ({ requireAdmin }));
vi.mock("@/entities/schedule/api/list-applicants-by-schedule", () => ({
  listApplicantsBySchedule,
}));

beforeEach(() => {
  requireAdmin.mockReset();
  listApplicantsBySchedule.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("listApplicantsByScheduleAction", () => {
  it("admin이면 조회를 호출하고 신청자 목록을 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    listApplicantsBySchedule.mockResolvedValue({ ok: true, data: [{ name: "김민준" }] });

    const { listApplicantsByScheduleAction } =
      await import("@/features/recruitment/api/list-applicants-by-schedule.action");
    const result = await listApplicantsByScheduleAction({
      scheduleId: "13000000-0000-4000-8000-000000000001",
    });

    expect(listApplicantsBySchedule).toHaveBeenCalledWith({
      scheduleId: "13000000-0000-4000-8000-000000000001",
    });
    expect(result).toEqual({ ok: true, applicants: [{ name: "김민준" }] });
  });

  it("admin이 아니면 조회 없이 거부 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });

    const { listApplicantsByScheduleAction } =
      await import("@/features/recruitment/api/list-applicants-by-schedule.action");
    const result = await listApplicantsByScheduleAction({
      scheduleId: "13000000-0000-4000-8000-000000000001",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.COMMON_FORBIDDEN });
    expect(listApplicantsBySchedule).not.toHaveBeenCalled();
  });

  it("scheduleId가 uuid가 아니면 조회 없이 SCHEDULING_VALIDATION을 반환한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });

    const { listApplicantsByScheduleAction } =
      await import("@/features/recruitment/api/list-applicants-by-schedule.action");
    const result = await listApplicantsByScheduleAction({ scheduleId: "not-a-uuid" });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION });
    expect(listApplicantsBySchedule).not.toHaveBeenCalled();
  });

  it("조회가 실패하면 그 실패 코드를 그대로 전달한다", async () => {
    requireAdmin.mockResolvedValue({ ok: true, roles: ["worker", "admin"] });
    listApplicantsBySchedule.mockResolvedValue({
      ok: false,
      code: ERROR_CODE.IDENTITY_NOT_ACTIVE,
    });

    const { listApplicantsByScheduleAction } =
      await import("@/features/recruitment/api/list-applicants-by-schedule.action");
    const result = await listApplicantsByScheduleAction({
      scheduleId: "13000000-0000-4000-8000-000000000001",
    });

    expect(result).toEqual({ ok: false, code: ERROR_CODE.IDENTITY_NOT_ACTIVE });
  });
});
