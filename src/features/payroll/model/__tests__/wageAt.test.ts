// 구현 대상: src/features/payroll/model/wage-at.ts
//
// wageAt(rates, date) — effective_date <= date인 행 중 가장 늦은 행의 amount를 낸다
// (plan AC-06, PAY-008·PAY-011). 첫 행보다 이른 날은 null이다 — 승인 전 날짜라 계산에서
// 뺀다.

import { wageAt } from "@/features/payroll/model/wage-at";

describe("wageAt — effective_date == date는 그 행을 쓴다(경계 동일)", () => {
  it("조회 날짜와 effective_date가 같은 행이 적용된다", () => {
    const rates = [
      { effective_date: "2026-07-01", amount: 11000 },
      { effective_date: "2026-08-01", amount: 12000 },
    ];

    expect(wageAt(rates, "2026-08-01")).toBe(12000);
  });
});

describe("wageAt — 첫 행보다 이른 날은 null이다", () => {
  it("승인 전 날짜라 계산에서 뺀다", () => {
    const rates = [{ effective_date: "2026-08-01", amount: 12000 }];

    expect(wageAt(rates, "2026-07-31")).toBeNull();
  });
});

describe("wageAt — 여러 행 중 effective_date <= date인 것 중 가장 늦은 것을 쓴다", () => {
  it("배열 순서와 무관하게 조회일 이전 중 가장 늦은 행을 고른다", () => {
    const rates = [
      { effective_date: "2026-09-01", amount: 13000 },
      { effective_date: "2026-07-01", amount: 11000 },
      { effective_date: "2026-08-01", amount: 12000 },
    ];

    expect(wageAt(rates, "2026-08-15")).toBe(12000);
  });
});
