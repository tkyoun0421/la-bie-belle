import { describe, expect, it } from "vitest";

import type { ScheduleConfirmation } from "@/entities/schedule/model/confirmation";

describe("ScheduleConfirmation", () => {
  it("revision·예정 출퇴근·예식 시간을 갖는다", () => {
    const confirmation: ScheduleConfirmation = {
      date: "2026-08-09",
      revision: 1,
      scheduledStart: "09:00",
      scheduledEnd: "18:00",
      ceremonyTime: "14:00",
      roster: [],
    };

    expect(confirmation.revision).toBeGreaterThan(0);
    expect(confirmation.scheduledStart).toMatch(/^\d{2}:\d{2}$/);
    expect(confirmation.ceremonyTime).toMatch(/^\d{2}:\d{2}$/);
  });
});
