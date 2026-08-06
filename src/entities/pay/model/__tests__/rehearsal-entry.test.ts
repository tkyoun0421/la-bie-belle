import { describe, expect, it } from "vitest";

import type { RehearsalEntry } from "@/entities/pay/model/rehearsal-entry";

describe("RehearsalEntry", () => {
  it("날짜·시작·종료 시각과 예상액을 갖는다", () => {
    const entry: RehearsalEntry = {
      id: "reh-1",
      date: "2026-08-11",
      startTime: "13:00",
      endTime: "15:00",
      amount: 20000,
    };

    expect(entry.startTime < entry.endTime).toBe(true);
  });
});
