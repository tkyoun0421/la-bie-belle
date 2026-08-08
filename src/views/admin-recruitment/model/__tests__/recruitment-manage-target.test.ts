import { describe, expect, it } from "vitest";

import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";
import { findManageableRecruitmentSchedule } from "@/views/admin-recruitment/model/recruitment-manage-target";

function schedule(workDate: string, status: RecruitmentSchedule["status"]): RecruitmentSchedule {
  return { id: `schedule-${workDate}`, workDate, applicationDeadline: workDate, status };
}

describe("findManageableRecruitmentSchedule", () => {
  it("OPEN 스케줄이 있는 날짜는 그 스케줄을 반환한다", () => {
    const schedules = [schedule("2099-09-20", "OPEN")];

    expect(findManageableRecruitmentSchedule(schedules, "2099-09-20")).toEqual(schedules[0]);
  });

  it("CLOSED 스케줄이 있는 날짜는 그 스케줄을 반환한다", () => {
    const schedules = [schedule("2099-09-21", "CLOSED")];

    expect(findManageableRecruitmentSchedule(schedules, "2099-09-21")).toEqual(schedules[0]);
  });

  it("PREPARING·CONFIRMED·CANCELLED 상태는 관리 대상이 아니라 null을 반환한다", () => {
    const schedules = [
      schedule("2099-09-22", "PREPARING"),
      schedule("2099-09-23", "CONFIRMED"),
      schedule("2099-09-24", "CANCELLED"),
    ];

    expect(findManageableRecruitmentSchedule(schedules, "2099-09-22")).toBeNull();
    expect(findManageableRecruitmentSchedule(schedules, "2099-09-23")).toBeNull();
    expect(findManageableRecruitmentSchedule(schedules, "2099-09-24")).toBeNull();
  });

  it("스케줄이 없는 날짜는 null을 반환한다", () => {
    expect(findManageableRecruitmentSchedule([], "2099-09-25")).toBeNull();
  });

  it("같은 근무일에 CANCELLED 행이 OPEN 행보다 먼저 오면 OPEN 행을 연장 대상으로 반환한다", () => {
    const cancelled = schedule("2099-09-26", "CANCELLED");
    const open = schedule("2099-09-26", "OPEN");
    const schedules = [cancelled, open];

    expect(findManageableRecruitmentSchedule(schedules, "2099-09-26")).toEqual(open);
  });

  it("같은 근무일에 CANCELLED 행이 CLOSED 행보다 먼저 오면 CLOSED 행을 재오픈 대상으로 반환한다", () => {
    const cancelled = schedule("2099-09-27", "CANCELLED");
    const closed = schedule("2099-09-27", "CLOSED");
    const schedules = [cancelled, closed];

    expect(findManageableRecruitmentSchedule(schedules, "2099-09-27")).toEqual(closed);
  });

  it("같은 근무일에 CANCELLED 행만 있으면(활성 행 없음) 관리 대상이 아니다", () => {
    const first = schedule("2099-09-28", "CANCELLED");
    const second = schedule("2099-09-28", "CANCELLED");
    const schedules = [first, second];

    expect(findManageableRecruitmentSchedule(schedules, "2099-09-28")).toBeNull();
  });
});
