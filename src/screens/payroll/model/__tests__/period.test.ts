// 구현 대상: src/screens/payroll/model/period.ts
//
// Period는 { unit: "week"; weekStart } | { unit: "month"; month } | { unit: "year"; year }다
// (weekStart는 그 주의 월요일 "YYYY-MM-DD", month는 "YYYY-MM", year는 "YYYY").
//
// periodLabel(period) — 기간 줄 가운데 문구다(payroll.md 「기간 줄」).
// shiftPeriod(period, step) — 화살표 이동. step은 뒤(-1)·앞(+1)이고 달·연 경계를 넘나든다.
// periodMonthKeys(period) — 그 기간의 금액을 내려면 읽어야 할 달 키(YYYY-MM) 목록이다
// (plan payroll-view AC-06 「기간이 달을 걸치면 키를 둘 읽어 합친다」).
//
// 주는 월요일~일요일이다(PAY-021).

import {
  periodLabel,
  periodMonthKeys,
  shiftPeriod,
} from "@/screens/payroll/model/period";

describe("periodLabel — 주가 한 달 안에 있으면 날짜만 쓴다", () => {
  it("2026-10-05(월)~10-11(일)은 '10월 5일~11일'이다", () => {
    expect(periodLabel({ unit: "week", weekStart: "2026-10-05" })).toBe(
      "10월 5일~11일",
    );
  });
});

describe("periodLabel — 달을 걸친 주는 연도 없이 두 달을 같이 쓴다", () => {
  it("2026-10-26(월)~11-01(일)은 '10월 26일~11월 1일'이다", () => {
    expect(periodLabel({ unit: "week", weekStart: "2026-10-26" })).toBe(
      "10월 26일~11월 1일",
    );
  });
});

describe("periodLabel — 월은 연도가 붙는다", () => {
  it("2026-10은 '2026년 10월'이다", () => {
    expect(periodLabel({ unit: "month", month: "2026-10" })).toBe(
      "2026년 10월",
    );
  });
});

describe("periodLabel — 연은 연도만 쓴다", () => {
  it("2026은 '2026년'이다", () => {
    expect(periodLabel({ unit: "year", year: "2026" })).toBe("2026년");
  });
});

describe("shiftPeriod — 12월의 다음 주가 1월로 넘어간다", () => {
  it("2026-12-28 주의 다음은 2027-01-04 주다", () => {
    expect(shiftPeriod({ unit: "week", weekStart: "2026-12-28" }, 1)).toEqual({
      unit: "week",
      weekStart: "2027-01-04",
    });
  });
});

describe("shiftPeriod — 12월의 다음 달이 1월로 넘어간다", () => {
  it("2026-12의 다음은 2027-01이다", () => {
    expect(shiftPeriod({ unit: "month", month: "2026-12" }, 1)).toEqual({
      unit: "month",
      month: "2027-01",
    });
  });
});

describe("shiftPeriod — 2026년의 다음이 2027년으로 넘어간다", () => {
  it("연 단위는 숫자를 그대로 올린다", () => {
    expect(shiftPeriod({ unit: "year", year: "2026" }, 1)).toEqual({
      unit: "year",
      year: "2027",
    });
  });
});

describe("shiftPeriod — 뒤로 가는 이동도 해를 넘나든다", () => {
  it("2026-01의 이전은 2025-12다", () => {
    expect(shiftPeriod({ unit: "month", month: "2026-01" }, -1)).toEqual({
      unit: "month",
      month: "2025-12",
    });
  });
});

describe("periodMonthKeys — 한 달 안의 주·월은 자기 달 키 하나다", () => {
  it("2026-10-05 주는 ['2026-10']이다", () => {
    expect(periodMonthKeys({ unit: "week", weekStart: "2026-10-05" })).toEqual([
      "2026-10",
    ]);
  });

  it("2026-10 월은 ['2026-10']이다", () => {
    expect(periodMonthKeys({ unit: "month", month: "2026-10" })).toEqual([
      "2026-10",
    ]);
  });
});

describe("periodMonthKeys — 달을 걸친 주는 두 달 키를 읽는다", () => {
  it("2026-10-26 주는 ['2026-10', '2026-11']이다", () => {
    expect(periodMonthKeys({ unit: "week", weekStart: "2026-10-26" })).toEqual([
      "2026-10",
      "2026-11",
    ]);
  });
});

describe("periodMonthKeys — 연은 열두 키를 읽는다", () => {
  it("2026년은 2026-01부터 2026-12까지 정확히 열둘이다", () => {
    const keys = periodMonthKeys({ unit: "year", year: "2026" });

    expect(keys).toHaveLength(12);
    expect(keys).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08",
      "2026-09",
      "2026-10",
      "2026-11",
      "2026-12",
    ]);
  });
});
