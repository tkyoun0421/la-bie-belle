import { describe, expect, it } from "vitest";

import type { RecruitmentSchedule } from "@/entities/schedule/model/recruitment-schedule";
import { selectScheduleForWorkDate } from "@/views/schedule-detail/model/select-schedule-for-work-date";

function schedule(overrides: Partial<RecruitmentSchedule>): RecruitmentSchedule {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    workDate: "2026-09-01",
    applicationDeadline: "2026-08-25",
    status: "CONFIRMED",
    ...overrides,
  };
}

describe("selectScheduleForWorkDate", () => {
  it("같은 근무일에 취소 행과 활성 행이 공존하면(취소 행이 먼저 와도) 활성 행을 고른다", () => {
    const cancelled = schedule({ id: "cancelled", status: "CANCELLED" });
    const active = schedule({ id: "active", status: "CONFIRMED" });

    expect(selectScheduleForWorkDate([cancelled, active], "2026-09-01")).toBe(active);
    expect(selectScheduleForWorkDate([active, cancelled], "2026-09-01")).toBe(active);
  });

  it("같은 근무일에 취소 행만 있으면 취소 행을 고른다", () => {
    const cancelled = schedule({ id: "cancelled", status: "CANCELLED" });

    expect(selectScheduleForWorkDate([cancelled], "2026-09-01")).toBe(cancelled);
  });

  it("일치하는 근무일 행이 없으면 undefined를 돌려준다", () => {
    const other = schedule({ id: "other", workDate: "2026-09-02" });

    expect(selectScheduleForWorkDate([other], "2026-09-01")).toBeUndefined();
  });

  it("활성 행 하나만 있으면 그 행을 고른다", () => {
    const active = schedule({ id: "active", status: "OPEN" });

    expect(selectScheduleForWorkDate([active], "2026-09-01")).toBe(active);
  });
});
