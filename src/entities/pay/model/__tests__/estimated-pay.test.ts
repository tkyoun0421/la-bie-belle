import { describe, expect, it } from "vitest";

import type { EstimatedPay } from "@/entities/pay/model/estimated-pay";

describe("EstimatedPay", () => {
  it("월 합계는 일반 근무 예상액과 리허설 예상액의 합이다", () => {
    const pay: EstimatedPay = {
      month: "2026-08",
      totalAmount: 120000,
      regularAmount: 100000,
      rehearsalAmount: 20000,
      items: [],
    };

    expect(pay.totalAmount).toBe(pay.regularAmount + pay.rehearsalAmount);
  });
});
