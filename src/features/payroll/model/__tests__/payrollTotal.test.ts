// 구현 대상: src/features/payroll/model/payroll-total.ts
//
// weekTotals(days) — 주는 월요일에 시작해 일요일에 끝난다(PAY-021). 달을 걸친 주도
// 주 하나로 묶는다.
// monthTotal(days, month) — 월은 달력 달이다(PAY-022). 달을 걸친 주는 날짜로 갈라 각
// 달의 합계에 따로 든다 — 8월 31일이 월요일이면 그 하루만 8월, 9월 1일부터 엿새는 9월.

import { monthTotal, weekTotals } from "@/features/payroll/model/payroll-total";

function payrollDay(date: string, amount: number, minutes = 480) {
  return { date, minutes, amount, kind: "normal" as const };
}

describe("weekTotals — 주는 월요일에 시작해 일요일에 끝난다(PAY-021)", () => {
  it("일요일과 그다음 월요일은 서로 다른 주로 갈린다", () => {
    const days = [
      payrollDay("2026-09-06", 96000), // 일요일
      payrollDay("2026-09-07", 96000), // 월요일
    ];

    const totals = weekTotals(days);

    expect(totals).toHaveLength(2);
    expect(totals.find((week) => week.weekStart === "2026-08-31")).toEqual({
      weekStart: "2026-08-31",
      minutes: 480,
      amount: 96000,
    });
    expect(totals.find((week) => week.weekStart === "2026-09-07")).toEqual({
      weekStart: "2026-09-07",
      minutes: 480,
      amount: 96000,
    });
  });
});

describe("weekTotals — 달을 걸친 주도 한 주로 묶는다(PAY-022 대조)", () => {
  it("8월 31일부터 9월 6일까지가 한 주 합계로 묶인다", () => {
    const days = [
      payrollDay("2026-08-31", 96000),
      payrollDay("2026-09-01", 96000),
      payrollDay("2026-09-06", 96000),
    ];

    const totals = weekTotals(days);

    expect(totals).toEqual([
      { weekStart: "2026-08-31", minutes: 1440, amount: 288000 },
    ]);
  });
});

describe("monthTotal — 달을 걸친 주는 날짜로 갈라 다른 달에 든다(PAY-022)", () => {
  it("8월 31일과 9월 1일~6일이 서로 다른 달 합계에 든다", () => {
    const days = [
      payrollDay("2026-08-31", 96000),
      payrollDay("2026-09-01", 50000),
      payrollDay("2026-09-06", 70000),
    ];

    expect(monthTotal(days, "2026-08")).toBe(96000);
    expect(monthTotal(days, "2026-09")).toBe(120000);
  });
});

describe("monthTotal — 월 합계는 그달 날짜별 금액의 합이다", () => {
  it("그달에 든 날짜의 amount를 모두 더한 값과 같다", () => {
    const days = [
      payrollDay("2026-09-02", 50000),
      payrollDay("2026-09-03", 70000),
      payrollDay("2026-10-01", 90000),
    ];

    const expected = days
      .filter((day) => day.date.startsWith("2026-09"))
      .reduce((sum, day) => sum + day.amount, 0);

    expect(monthTotal(days, "2026-09")).toBe(expected);
  });
});
