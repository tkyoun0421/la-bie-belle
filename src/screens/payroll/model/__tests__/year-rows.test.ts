// 구현 대상: src/screens/payroll/model/year-rows.ts
//
// PayrollMonthRow = { month: "YYYY-MM", amount }다.
//
// yearRows(months) — 「연」 단위 목록이다(payroll.md 「내역 목록」). 달마다 한
// 줄로 접히고 최근이 위다(12월이 맨 위, 1월이 맨 아래). 맨 아래에 합계 줄이
// 하나 더 붙고 값은 열두 달 합과 같다. 주·월 단위에는 이 함수 자체를 안 부른다.

import { yearRows } from "@/screens/payroll/model/year-rows";

describe("yearRows — 최근이 위다(12월이 맨 위, 1월이 맨 아래)", () => {
  it("입력 순서와 무관하게 달을 내림차순으로 접는다", () => {
    const rows = yearRows([
      { month: "2026-01", amount: 100000 },
      { month: "2026-03", amount: 300000 },
      { month: "2026-02", amount: 200000 },
    ]);

    expect(rows.map((row) => row.type === "month" && row.month)).toEqual([
      "2026-03",
      "2026-02",
      "2026-01",
    ]);
  });
});

describe("yearRows — 합계 줄이 맨 아래에 붙는다", () => {
  it("합계 줄의 type이 'total'이고 목록 마지막이다", () => {
    const rows = yearRows([
      { month: "2026-01", amount: 100000 },
      { month: "2026-02", amount: 200000 },
    ]);

    expect(rows[rows.length - 1].type).toBe("total");
  });
});

describe("yearRows — 달 줄의 금액은 그 달 합과 같다", () => {
  it("2026-10의 금액이 108,000원이면 그 줄도 108,000원이다", () => {
    const rows = yearRows([{ month: "2026-10", amount: 108000 }]);
    const monthRow = rows.find((row) => row.type === "month");

    expect(monthRow?.amountLabel).toBe("108,000원");
  });
});

describe("yearRows — 합계는 열두(또는 주어진 모든) 달의 합이다", () => {
  it("100,000 + 200,000 + 300,000은 600,000원이다", () => {
    const rows = yearRows([
      { month: "2026-01", amount: 100000 },
      { month: "2026-02", amount: 200000 },
      { month: "2026-03", amount: 300000 },
    ]);

    const totalRow = rows.find((row) => row.type === "total");

    expect(totalRow?.amountLabel).toBe("600,000원");
  });
});

describe("yearRows — 합계 줄은 달 개수와 무관하게 항상 선다", () => {
  it("달이 하나뿐이어도 합계 줄이 그 달과 같은 값으로 선다", () => {
    const rows = yearRows([{ month: "2026-06", amount: 50000 }]);

    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual({ type: "total", amountLabel: "50,000원" });
  });
});
