import { describe, expect, it } from "vitest";

import { calculateRehearsalAmount } from "@/entities/pay/model/rehearsal-entry";
import {
  HEAVY_REHEARSAL_ENTRIES,
  REHEARSAL_ENTRIES,
} from "@/entities/pay/model/rehearsal-entry.mock";

describe("rehearsal-entry mock", () => {
  it("이번 달 리허설 기록 목록을 제공한다", () => {
    expect(REHEARSAL_ENTRIES.length).toBeGreaterThan(0);
  });

  it("각 기록의 종료 시각은 시작 시각보다 늦다", () => {
    for (const entry of REHEARSAL_ENTRIES) {
      expect(entry.startTime < entry.endTime).toBe(true);
    }
  });

  it("각 기록의 예상액은 시급 스냅샷 × 시간과 일치한다", () => {
    for (const entry of [...REHEARSAL_ENTRIES, ...HEAVY_REHEARSAL_ENTRIES]) {
      expect(entry.amount).toBe(
        calculateRehearsalAmount(entry.startTime, entry.endTime, entry.hourlyRate),
      );
    }
  });

  it("HEAVY_REHEARSAL_ENTRIES는 REHEARSAL_ENTRIES와 다른 독립 시나리오다", () => {
    expect(HEAVY_REHEARSAL_ENTRIES).not.toBe(REHEARSAL_ENTRIES);
    const heavyTotal = HEAVY_REHEARSAL_ENTRIES.reduce((sum, entry) => sum + entry.amount, 0);
    const lightTotal = REHEARSAL_ENTRIES.reduce((sum, entry) => sum + entry.amount, 0);
    expect(heavyTotal).not.toBe(lightTotal);
  });
});
