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
});
