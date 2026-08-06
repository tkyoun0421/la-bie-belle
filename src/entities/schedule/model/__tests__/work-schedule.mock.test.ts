import { describe, expect, it } from "vitest";

import {
  CLOSED_WORK_SCHEDULE,
  MIXED_MONTH_WORK_SCHEDULES,
  OPEN_WORK_SCHEDULE,
} from "@/entities/schedule/model/work-schedule.mock";

describe("work-schedule mock", () => {
  it("open과 closed 시나리오를 각각 제공한다", () => {
    expect(OPEN_WORK_SCHEDULE.status).toBe("open");
    expect(CLOSED_WORK_SCHEDULE.status).toBe("closed");
  });

  it("신청 마감일을 ISO 날짜로 갖는다", () => {
    expect(OPEN_WORK_SCHEDULE.applicationDeadline).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it("혼합 월 시나리오는 달력 상태 파생에 쓸 여러 날짜를 포함한다", () => {
    expect(MIXED_MONTH_WORK_SCHEDULES.length).toBeGreaterThan(1);
  });
});
