import { describe, expect, it } from "vitest";

import type { RecruitmentStatus, WorkSchedule } from "@/entities/schedule/model/work-schedule";

describe("WorkSchedule", () => {
  it("모집 상태는 open 또는 closed만 허용한다", () => {
    const statuses: RecruitmentStatus[] = ["open", "closed"];
    const schedule: WorkSchedule = {
      date: "2026-08-09",
      status: "open",
      applicationDeadline: "2026-08-07T23:59:00+09:00",
    };

    expect(statuses).toContain(schedule.status);
  });
});
