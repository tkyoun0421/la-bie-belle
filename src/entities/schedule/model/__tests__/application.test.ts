import { describe, expect, it } from "vitest";

import type { ScheduleApplication } from "@/entities/schedule/model/application";

describe("ScheduleApplication", () => {
  it("신청은 근무 가능 여부이며 희망 포지션을 갖지 않는다", () => {
    const application: ScheduleApplication = {
      date: "2026-08-04",
      appliedAt: "2026-08-01T10:12:00+09:00",
    };
    const keys = Object.keys(application);

    expect(keys).not.toContain("desiredPosition");
    expect(keys).not.toContain("position");
  });
});
