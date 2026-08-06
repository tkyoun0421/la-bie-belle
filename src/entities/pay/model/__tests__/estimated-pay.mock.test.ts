import { describe, expect, it } from "vitest";

import {
  HEAVY_REHEARSAL_ENTRIES,
  REHEARSAL_ENTRIES,
} from "@/entities/pay/model/rehearsal-entry.mock";
import {
  EMPTY_MONTH_ESTIMATED_PAY,
  ESTIMATED_PAY_WITH_ITEMS,
  ESTIMATED_PAY_WITH_REHEARSAL,
} from "@/entities/pay/model/estimated-pay.mock";

function sumAmount(entries: { amount: number }[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

describe("estimated-pay mock", () => {
  it("월 합계는 예정 시간 기반 내역의 합과 일치한다(정산이 아닌 예상 규칙)", () => {
    expect(ESTIMATED_PAY_WITH_ITEMS.totalAmount).toBe(
      ESTIMATED_PAY_WITH_ITEMS.regularAmount + ESTIMATED_PAY_WITH_ITEMS.rehearsalAmount,
    );
    expect(ESTIMATED_PAY_WITH_ITEMS.items.length).toBeGreaterThan(0);
  });

  it("리허설 예상액은 REHEARSAL_ENTRIES 합계와 일치한다", () => {
    expect(ESTIMATED_PAY_WITH_ITEMS.rehearsalAmount).toBe(sumAmount(REHEARSAL_ENTRIES));
  });

  it("날짜별 내역에는 리허설 줄이 중복되지 않는다(리허설 기록 목록과 별개로 표시)", () => {
    expect(ESTIMATED_PAY_WITH_ITEMS.items.every((item) => item.label !== "리허설")).toBe(true);
  });

  it("빈 달 시나리오는 내역이 없고 합계가 0이다", () => {
    expect(EMPTY_MONTH_ESTIMATED_PAY.items).toHaveLength(0);
    expect(EMPTY_MONTH_ESTIMATED_PAY.totalAmount).toBe(0);
  });

  it("리허설 포함 시나리오는 내역 있음 시나리오와 다른 독립 fixture다", () => {
    expect(ESTIMATED_PAY_WITH_REHEARSAL).not.toBe(ESTIMATED_PAY_WITH_ITEMS);
    expect(ESTIMATED_PAY_WITH_REHEARSAL.rehearsalAmount).toBe(sumAmount(HEAVY_REHEARSAL_ENTRIES));
    expect(ESTIMATED_PAY_WITH_REHEARSAL.rehearsalAmount).not.toBe(
      ESTIMATED_PAY_WITH_ITEMS.rehearsalAmount,
    );
    expect(ESTIMATED_PAY_WITH_REHEARSAL.totalAmount).toBe(
      ESTIMATED_PAY_WITH_REHEARSAL.regularAmount + ESTIMATED_PAY_WITH_REHEARSAL.rehearsalAmount,
    );
  });
});
