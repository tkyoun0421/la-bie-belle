import { describe, expect, it } from "vitest";

import {
  calculateRehearsalAmount,
  calculateRehearsalHours,
} from "@/entities/pay/model/rehearsal-entry";
import type { RehearsalEntry } from "@/entities/pay/model/rehearsal-entry";

describe("RehearsalEntry", () => {
  it("날짜·시작·종료 시각·시급 스냅샷과 예상액을 갖는다", () => {
    const entry: RehearsalEntry = {
      id: "reh-1",
      date: "2026-08-11",
      startTime: "13:00",
      endTime: "15:00",
      hourlyRate: 15000,
      amount: 30000,
    };

    expect(entry.startTime < entry.endTime).toBe(true);
  });
});

describe("calculateRehearsalHours", () => {
  it("종료-시작 시각의 차이를 시간 단위로 계산한다", () => {
    expect(calculateRehearsalHours("13:00", "15:00")).toBe(2);
    expect(calculateRehearsalHours("10:00", "11:30")).toBe(1.5);
  });

  it("종료가 시작보다 빠르거나 같으면 0을 반환한다", () => {
    expect(calculateRehearsalHours("15:00", "13:00")).toBe(0);
    expect(calculateRehearsalHours("13:00", "13:00")).toBe(0);
  });
});

describe("calculateRehearsalAmount", () => {
  it("시간 × 시급을 반올림한 예상액을 계산한다(정산이 아닌 예상 규칙)", () => {
    expect(calculateRehearsalAmount("13:00", "15:00", 15000)).toBe(30000);
    expect(calculateRehearsalAmount("10:00", "11:30", 15000)).toBe(22500);
  });
});
