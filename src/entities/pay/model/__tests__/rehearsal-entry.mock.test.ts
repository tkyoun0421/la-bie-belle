import { describe, expect, it } from "vitest";

import { REHEARSAL_ENTRIES } from "@/entities/pay/model/rehearsal-entry.mock";

describe("rehearsal-entry mock", () => {
  it("이번 달 리허설 기록 목록을 제공한다", () => {
    expect(REHEARSAL_ENTRIES.length).toBeGreaterThan(0);
  });

  it("각 기록의 종료 시각은 시작 시각보다 늦다", () => {
    for (const entry of REHEARSAL_ENTRIES) {
      expect(entry.startTime < entry.endTime).toBe(true);
    }
  });
});
