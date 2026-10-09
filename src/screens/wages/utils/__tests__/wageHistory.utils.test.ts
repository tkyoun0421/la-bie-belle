import type { WageRate } from "@/entities/payroll/model/payroll.type";
import {
  buildWageHistory,
  prefillWageAmount,
} from "@/screens/wages/utils/wageHistory.utils";

describe("buildWageHistory — 0줄이면 안 그린다", () => {
  it("이력이 없으면 rows가 비고 hasMore도 false다", () => {
    const result = buildWageHistory([]);

    expect(result.rows).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});

describe("buildWageHistory — 1줄이면 안 그린다", () => {
  it("이력이 한 줄뿐이면 rows가 빈다", () => {
    const rows: WageRate[] = [{ effectiveDate: "2026-01-01", amount: 11000 }];

    const result = buildWageHistory(rows);

    expect(result.rows).toEqual([]);
    expect(result.hasMore).toBe(false);
  });
});

describe("buildWageHistory — 2줄이면 그대로 다 보이고 최신이 위다", () => {
  it("두 줄을 최신순으로 그대로 낸다", () => {
    const rows: WageRate[] = [
      { effectiveDate: "2026-01-01", amount: 11000 },
      { effectiveDate: "2026-06-01", amount: 12000 },
    ];

    const result = buildWageHistory(rows);

    expect(result.rows).toEqual([
      { effectiveDate: "2026-06-01", amount: 12000 },
      { effectiveDate: "2026-01-01", amount: 11000 },
    ]);
    expect(result.hasMore).toBe(false);
  });
});

describe("buildWageHistory — 4줄 이상은 최근 셋만 보이고 더보기가 붙는다", () => {
  it("최근 셋만 최신순으로 남고 hasMore가 true다", () => {
    const rows: WageRate[] = [
      { effectiveDate: "2026-01-01", amount: 10000 },
      { effectiveDate: "2026-04-01", amount: 11000 },
      { effectiveDate: "2026-02-01", amount: 10500 },
      { effectiveDate: "2026-03-01", amount: 10800 },
    ];

    const result = buildWageHistory(rows);

    expect(result.rows).toEqual([
      { effectiveDate: "2026-04-01", amount: 11000 },
      { effectiveDate: "2026-03-01", amount: 10800 },
      { effectiveDate: "2026-02-01", amount: 10500 },
    ]);
    expect(result.hasMore).toBe(true);
  });
});

describe("prefillWageAmount — 시급 이력이 빈 사람의 prefill은 빈 칸(null)이다", () => {
  it("이력이 없으면 0원이 아니라 null이다", () => {
    expect(prefillWageAmount([], "2026-09-28")).toBeNull();
  });
});

describe("prefillWageAmount — kstToday()로 받은 today 인자를 그대로 기준일로 쓴다", () => {
  it("today가 달라지면 그 날짜 기준의 유효 금액이 달라진다", () => {
    const rates: WageRate[] = [
      { effectiveDate: "2026-01-01", amount: 10000 },
      { effectiveDate: "2026-06-01", amount: 12000 },
    ];

    expect(prefillWageAmount(rates, "2026-03-01")).toBe(10000);
    expect(prefillWageAmount(rates, "2026-07-01")).toBe(12000);
  });
});
