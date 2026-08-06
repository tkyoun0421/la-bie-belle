import { describe, expect, it } from "vitest";

import {
  EMPTY_MONTH_ESTIMATED_PAY,
  ESTIMATED_PAY_WITH_ITEMS,
  ESTIMATED_PAY_WITH_REHEARSAL,
} from "@/entities/pay/model/estimated-pay.mock";

describe("estimated-pay mock", () => {
  it("월 합계는 예정 시간 기반 내역의 합과 일치한다(정산이 아닌 예상 규칙)", () => {
    expect(ESTIMATED_PAY_WITH_ITEMS.totalAmount).toBe(
      ESTIMATED_PAY_WITH_ITEMS.regularAmount + ESTIMATED_PAY_WITH_ITEMS.rehearsalAmount,
    );
    expect(ESTIMATED_PAY_WITH_ITEMS.items.length).toBeGreaterThan(0);
  });

  it("빈 달 시나리오는 내역이 없고 합계가 0이다", () => {
    expect(EMPTY_MONTH_ESTIMATED_PAY.items).toHaveLength(0);
    expect(EMPTY_MONTH_ESTIMATED_PAY.totalAmount).toBe(0);
  });

  it("리허설 포함 시나리오는 리허설 예상액이 0보다 크다", () => {
    expect(ESTIMATED_PAY_WITH_REHEARSAL.rehearsalAmount).toBeGreaterThan(0);
  });
});
