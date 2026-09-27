import { shiftMonth, spellMonth } from "@/shared/lib/kst-date";
import { weekStartOf } from "@/features/payroll/model/payroll-total";

/**
 * 급여 조회가 보고 있는 기간이다. 세그먼트가 단위를 고르고 화살표가 그 단위 안에서 앞뒤로
 * 움직인다(`docs/2-design/modules/payroll/screens/payroll.md`의 「기간 줄」).
 *
 * **기간을 자르는 축이 단위마다 다르다.** 주는 월요일~일요일이고(PAY-021) 달은 달력 달이다
 * (PAY-022). 그래서 달을 걸친 주는 주 보기에서 이레가 한 덩이고 월 보기에서는 날마다 갈린다 —
 * 같은 이레가 단위에 따라 한 줄이 되기도 두 달로 흩어지기도 한다.
 *
 * **읽을 달 키를 기간이 낸다.** 금액의 재료는 달치로 오는데(`['payroll', 'YYYY-MM']`) 기간은
 * 달과 안 맞을 수 있다 — 달을 걸친 주는 키가 둘이고 연은 열둘이다(plan payroll-view AC-06).
 */

export type PeriodUnit = "week" | "month" | "year";

export type Period =
  | { unit: "week"; weekStart: string }
  | { unit: "month"; month: string }
  | { unit: "year"; year: string };

const DAY_MS = 24 * 60 * 60 * 1000;

const LAST_DAY_OF_WEEK = 6;

const MONTHS_PER_YEAR = 12;

function shiftDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

function weekEndOf(weekStart: string): string {
  return shiftDays(weekStart, LAST_DAY_OF_WEEK);
}

/** 주 보기는 연도를 안 쓴다 — 같은 줄에 날짜가 이미 둘이다. */
function spellWeek(weekStart: string): string {
  const weekEnd = weekEndOf(weekStart);
  const [, fromMonth, fromDay] = weekStart.split("-").map(Number);
  const [, toMonth, toDay] = weekEnd.split("-").map(Number);

  return fromMonth === toMonth
    ? `${fromMonth}월 ${fromDay}일~${toDay}일`
    : `${fromMonth}월 ${fromDay}일~${toMonth}월 ${toDay}일`;
}

export function periodLabel(period: Period): string {
  switch (period.unit) {
    case "week":
      return spellWeek(period.weekStart);
    case "month":
      return spellMonth(period.month);
    case "year":
      return `${period.year}년`;
  }
}

export function shiftPeriod(period: Period, step: number): Period {
  switch (period.unit) {
    case "week":
      return {
        unit: "week",
        weekStart: shiftDays(period.weekStart, step * (LAST_DAY_OF_WEEK + 1)),
      };
    case "month":
      return { unit: "month", month: shiftMonth(period.month, step) };
    case "year":
      return { unit: "year", year: String(Number(period.year) + step) };
  }
}

export function periodMonthKeys(period: Period): string[] {
  switch (period.unit) {
    case "week":
      return [
        ...new Set([
          period.weekStart.slice(0, 7),
          weekEndOf(period.weekStart).slice(0, 7),
        ]),
      ];
    case "month":
      return [period.month];
    case "year":
      return Array.from(
        { length: MONTHS_PER_YEAR },
        (_, at) => `${period.year}-${String(at + 1).padStart(2, "0")}`,
      );
  }
}

/**
 * 기간을 한 줄로 세운 값이다. 같은 단위끼리 글자 순으로 견주면 앞뒤가 나온다 — 셋 다 자릿수가
 * 고정이라 날짜를 다시 숫자로 풀 일이 없다.
 */
export function periodAnchor(period: Period): string {
  switch (period.unit) {
    case "week":
      return period.weekStart;
    case "month":
      return period.month;
    case "year":
      return period.year;
  }
}

/** 그 날짜가 든 기간의 앵커다. 경계는 날짜 하나를 기간으로 올려 견주는 일이다. */
export function anchorOfDate(date: string, unit: PeriodUnit): string {
  switch (unit) {
    case "week":
      return weekStartOf(date);
    case "month":
      return date.slice(0, 7);
    case "year":
      return date.slice(0, 4);
  }
}
