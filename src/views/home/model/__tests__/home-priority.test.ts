import { describe, expect, it } from "vitest";

import type { AttendanceStatus } from "@/entities/attendance/model/attendance-status";
import type { ScheduleConfirmation } from "@/entities/schedule/model/confirmation";
import { deriveHomePriority } from "@/views/home/model/home-priority";

const ATTENDANCE_STATUS: AttendanceStatus = { type: "ready", action: "check-in" };
const CONFIRMATION: ScheduleConfirmation = {
  date: "2026-08-14",
  revision: 2,
  scheduledStart: "09:30",
  scheduledEnd: "18:30",
  ceremonyTime: "14:30",
  roster: [],
  changeSummary: "시작 시간이 30분 당겨졌어요",
};

const EMPTY_INPUT = {
  attendance: null,
  deadlineApplication: null,
  confirmationChange: null,
  nextShift: null,
} as const;

describe("deriveHomePriority", () => {
  it("오늘 출퇴근이 가능하면 최우선이다", () => {
    const model = deriveHomePriority({
      attendance: { status: ATTENDANCE_STATUS, shiftDate: "2026-08-09", position: "플로어" },
      deadlineApplication: { date: "2026-08-09", applicationDeadline: "2026-08-07" },
      confirmationChange: CONFIRMATION,
      nextShift: { date: "2026-08-09", position: "플로어" },
    });

    expect(model).toEqual({
      priority: "attendance",
      attendanceStatus: ATTENDANCE_STATUS,
      shiftDate: "2026-08-09",
      position: "플로어",
    });
  });

  it("출퇴근이 없으면 마감 임박 신청을 다음으로 우선한다", () => {
    const model = deriveHomePriority({
      ...EMPTY_INPUT,
      deadlineApplication: { date: "2026-08-09", applicationDeadline: "2026-08-07" },
      confirmationChange: CONFIRMATION,
      nextShift: { date: "2026-08-09", position: "플로어" },
    });

    expect(model).toEqual({
      priority: "deadline-application",
      date: "2026-08-09",
      applicationDeadline: "2026-08-07",
    });
  });

  it("마감 임박이 없으면 확정 변경 확인을 우선한다", () => {
    const model = deriveHomePriority({
      ...EMPTY_INPUT,
      confirmationChange: CONFIRMATION,
      nextShift: { date: "2026-08-09", position: "플로어" },
    });

    expect(model).toEqual({ priority: "confirmation-change", confirmation: CONFIRMATION });
  });

  it("앞선 조건이 모두 없으면 다음 근무를 보여준다", () => {
    const model = deriveHomePriority({
      ...EMPTY_INPUT,
      nextShift: { date: "2026-08-09", position: "플로어" },
    });

    expect(model).toEqual({ priority: "next-shift", date: "2026-08-09", position: "플로어" });
  });

  it("아무 조건도 없으면 빈 상태다", () => {
    expect(deriveHomePriority(EMPTY_INPUT)).toEqual({ priority: "empty" });
  });
});
