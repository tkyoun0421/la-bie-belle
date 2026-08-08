import { describe, expect, it } from "vitest";

import type { ApplicationCountEntry } from "@/entities/schedule/model/application-count";

describe("ApplicationCountEntry", () => {
  it("scheduleId별 신청 수를 갖는다", () => {
    const entry: ApplicationCountEntry = { scheduleId: "schedule-1", count: 3 };

    expect(entry.count).toBeGreaterThanOrEqual(0);
  });
});
