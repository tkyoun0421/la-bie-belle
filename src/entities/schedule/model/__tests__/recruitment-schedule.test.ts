import { describe, expect, it } from "vitest";

import {
  RECRUITMENT_SCHEDULE_STATUS_VALUES,
  mapRecruitmentScheduleRow,
} from "@/entities/schedule/model/recruitment-schedule";

describe("mapRecruitmentScheduleRow", () => {
  it("스네이크 케이스 DB 행을 카멜 케이스 DTO로 매핑한다", () => {
    const mapped = mapRecruitmentScheduleRow({
      id: "schedule-1",
      work_date: "2099-09-01",
      application_deadline: "2099-09-01",
      status: "OPEN",
    });

    expect(mapped).toEqual({
      id: "schedule-1",
      workDate: "2099-09-01",
      applicationDeadline: "2099-09-01",
      status: "OPEN",
    });
  });

  it("RECRUITMENT_SCHEDULE_STATUS_VALUES는 DB enum 5종과 같다", () => {
    expect(RECRUITMENT_SCHEDULE_STATUS_VALUES).toEqual([
      "OPEN",
      "CLOSED",
      "PREPARING",
      "CONFIRMED",
      "CANCELLED",
    ]);
  });

  it("등록되지 않은 status 값은 매핑 시 던진다", () => {
    expect(() =>
      mapRecruitmentScheduleRow({
        id: "schedule-2",
        work_date: "2099-09-02",
        application_deadline: "2099-09-02",
        status: "UNKNOWN",
      }),
    ).toThrow();
  });
});
