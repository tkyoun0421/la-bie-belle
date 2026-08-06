import { describe, expect, it } from "vitest";

import { deriveHomePriority } from "@/views/home/model/home-priority";

const EMPTY_INPUT = {
  attendanceAction: null,
  deadlineSoonApplication: false,
  unacknowledgedChange: false,
  nextShiftDate: null,
} as const;

describe("deriveHomePriority", () => {
  it("오늘 출퇴근이 가능하면 최우선이다", () => {
    const priority = deriveHomePriority({
      ...EMPTY_INPUT,
      attendanceAction: "check-in",
      deadlineSoonApplication: true,
      unacknowledgedChange: true,
      nextShiftDate: "2026-08-09",
    });

    expect(priority).toEqual({ type: "attendance", action: "check-in" });
  });

  it("출퇴근이 없으면 마감 임박 신청을 다음으로 우선한다", () => {
    const priority = deriveHomePriority({
      ...EMPTY_INPUT,
      deadlineSoonApplication: true,
      unacknowledgedChange: true,
      nextShiftDate: "2026-08-09",
    });

    expect(priority).toEqual({ type: "deadline-application" });
  });

  it("마감 임박이 없으면 확정 변경 확인을 우선한다", () => {
    const priority = deriveHomePriority({
      ...EMPTY_INPUT,
      unacknowledgedChange: true,
      nextShiftDate: "2026-08-09",
    });

    expect(priority).toEqual({ type: "confirmation-change" });
  });

  it("앞선 조건이 모두 없으면 다음 근무를 보여준다", () => {
    const priority = deriveHomePriority({ ...EMPTY_INPUT, nextShiftDate: "2026-08-09" });

    expect(priority).toEqual({ type: "next-shift", date: "2026-08-09" });
  });

  it("아무 조건도 없으면 빈 상태다", () => {
    expect(deriveHomePriority(EMPTY_INPUT)).toEqual({ type: "empty" });
  });
});
