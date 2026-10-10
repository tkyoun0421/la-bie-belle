import { isInSpan } from "@/features/payrollCompute/model/dateSpan.policy";
import {
  isInPeriod,
  periodLabel,
  periodMonthKeys,
  periodOf,
  periodSpan,
  periodStartDate,
  periodUnitOf,
  shiftPeriod,
} from "@/features/payrollCompute/model/period.policy";

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

describe("periodOf — 주 단위는 그 날짜가 든 주의 월요일을 낸다", () => {
  it("2026-10-07(수)이 든 주는 2026-10-05(월)에서 시작한다", () => {
    expect(periodOf("2026-10-07", "week")).toEqual({
      unit: "week",
      weekStart: "2026-10-05",
    });
  });
});

describe("periodOf — 연 경계를 넘는 주도 그 주의 월요일로 접힌다", () => {
  it("2027-01-01(금)이 든 주는 2026-12-28(월)에서 시작한다", () => {
    expect(periodOf("2027-01-01", "week")).toEqual({
      unit: "week",
      weekStart: "2026-12-28",
    });
  });
});

describe("periodOf — 월 단위는 그 날짜가 든 달을 낸다", () => {
  it("2026-10-15는 2026-10월이다", () => {
    expect(periodOf("2026-10-15", "month")).toEqual({
      unit: "month",
      month: "2026-10",
    });
  });
});

describe("periodOf — 연 단위는 그 날짜가 든 해를 낸다", () => {
  it("2026-10-15는 2026년이다", () => {
    expect(periodOf("2026-10-15", "year")).toEqual({
      unit: "year",
      year: "2026",
    });
  });
});

describe("periodStartDate — 주의 시작일은 weekStart 그대로다", () => {
  it("weekStart가 2026-10-05면 시작일도 2026-10-05다", () => {
    expect(periodStartDate({ unit: "week", weekStart: "2026-10-05" })).toBe(
      "2026-10-05",
    );
  });
});

describe("periodStartDate — 월의 시작일은 그 달 1일이다", () => {
  it("2026-10월의 시작일은 2026-10-01이다", () => {
    expect(periodStartDate({ unit: "month", month: "2026-10" })).toBe(
      "2026-10-01",
    );
  });
});

describe("periodStartDate — 연의 시작일은 1월 1일이다", () => {
  it("2026년의 시작일은 2026-01-01이다", () => {
    expect(periodStartDate({ unit: "year", year: "2026" })).toBe("2026-01-01");
  });
});

describe("isInPeriod — 주의 첫날과 마지막날 모두 그 주 안이다", () => {
  it("2026-10-05(월)와 2026-10-11(일) 둘 다 그 주 기간 안이다", () => {
    const period = { unit: "week" as const, weekStart: "2026-10-05" };

    expect(isInPeriod(period, "2026-10-05")).toBe(true);
    expect(isInPeriod(period, "2026-10-11")).toBe(true);
  });
});

describe("isInPeriod — 달을 걸친 주는 두 달의 날짜 모두 그 주 기간 안이다", () => {
  it("2026-10-26 주의 11월 첫날(2026-11-01)도 그 주 기간 안이다", () => {
    const period = { unit: "week" as const, weekStart: "2026-10-26" };

    expect(isInPeriod(period, "2026-10-26")).toBe(true);
    expect(isInPeriod(period, "2026-11-01")).toBe(true);
  });
});

describe("isInPeriod — 다음 주로 넘어간 날짜는 기간 밖이다", () => {
  it("2026-11-02(월)는 2026-10-26 주 기간 밖이다", () => {
    expect(
      isInPeriod({ unit: "week", weekStart: "2026-10-26" }, "2026-11-02"),
    ).toBe(false);
  });
});

describe("isInPeriod — 월 단위는 그 달 안의 날짜만 참이다", () => {
  it("2026-10-31은 2026-10월 안이고 2026-11-01은 밖이다", () => {
    const period = { unit: "month" as const, month: "2026-10" };

    expect(isInPeriod(period, "2026-10-31")).toBe(true);
    expect(isInPeriod(period, "2026-11-01")).toBe(false);
  });
});

describe("isInPeriod — 연 경계에서 12월 31일은 그 해 안, 1월 1일은 다음 해다", () => {
  it("2026년 기간은 2026-12-31을 품고 2027-01-01은 밖이다", () => {
    const period = { unit: "year" as const, year: "2026" };

    expect(isInPeriod(period, "2026-12-31")).toBe(true);
    expect(isInPeriod(period, "2027-01-01")).toBe(false);
  });
});

describe("periodUnitOf — 유효한 값 셋을 그대로 낸다", () => {
  it("week·month·year를 각각 그대로 읽는다", () => {
    expect(periodUnitOf("week")).toBe("week");
    expect(periodUnitOf("month")).toBe("month");
    expect(periodUnitOf("year")).toBe("year");
  });
});

describe("periodUnitOf — 모르는 값은 월이다(PAY-025)", () => {
  it("빈 문자열이나 오타는 'month'로 읽는다", () => {
    expect(periodUnitOf("")).toBe("month");
    expect(periodUnitOf("weekly")).toBe("month");
  });
});

describe("periodSpan — 주는 월요일부터 일요일까지다", () => {
  it("2026-10-05(월)의 구간은 10-05부터 10-11까지다", () => {
    expect(periodSpan({ unit: "week", weekStart: "2026-10-05" })).toEqual({
      from: "2026-10-05",
      to: "2026-10-11",
    });
  });

  it("달을 걸친 주도 이어진 일곱 날이다", () => {
    expect(periodSpan({ unit: "week", weekStart: "2026-10-26" })).toEqual({
      from: "2026-10-26",
      to: "2026-11-01",
    });
  });
});

describe("periodSpan — 월과 연은 그 기간의 첫날과 끝날이다", () => {
  it("2026-10은 10-01부터 10-31까지다", () => {
    expect(periodSpan({ unit: "month", month: "2026-10" })).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("2026년은 01-01부터 12-31까지다", () => {
    expect(periodSpan({ unit: "year", year: "2026" })).toEqual({
      from: "2026-01-01",
      to: "2026-12-31",
    });
  });
});

describe("periodSpan — 월은 그 달의 마지막 날짜로 끝난다(31일로 고정하지 않는다)", () => {
  it("2026-02은 2월 28일까지다", () => {
    expect(periodSpan({ unit: "month", month: "2026-02" })).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("윤년 2028-02은 2월 29일까지다", () => {
    expect(periodSpan({ unit: "month", month: "2028-02" })).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("30일 달 2026-04은 4월 30일까지다", () => {
    expect(periodSpan({ unit: "month", month: "2026-04" })).toEqual({
      from: "2026-04-01",
      to: "2026-04-30",
    });
  });
});

describe("periodSpan — isInPeriod가 참인 날과 같은 날을 담는다", () => {
  it("달을 걸친 주에서 두 판정이 어긋나지 않는다", () => {
    const period = { unit: "week", weekStart: "2026-10-26" } as const;
    const span = periodSpan(period);

    for (const date of [
      "2026-10-25",
      "2026-10-26",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]) {
      expect(isInSpan(span, date)).toBe(isInPeriod(period, date));
    }
  });

  it("연 경계에서도 두 판정이 어긋나지 않는다", () => {
    const period = { unit: "year", year: "2026" } as const;
    const span = periodSpan(period);

    for (const date of [
      "2025-12-31",
      "2026-01-01",
      "2026-12-31",
      "2027-01-01",
    ]) {
      expect(isInSpan(span, date)).toBe(isInPeriod(period, date));
    }
  });
});
