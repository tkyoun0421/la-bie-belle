import { spellAmount } from "@/screens/payroll/model/summary";

/**
 * 「연」 단위의 목록이다(`docs/2-design/modules/payroll/screens/payroll.md`의 「내역 목록」).
 * 날마다 늘어놓으면 삼백 줄이라 달마다 한 줄로 접는다.
 *
 * **여기도 최근이 위다.** 12월이 맨 위고 1월이 맨 아래다 — 날짜 목록과 방향이 같아야 단위를
 * 바꿔도 눈이 같은 자리를 본다.
 *
 * **맨 아래에 합계 줄이 선다.** 값은 화면 위의 금액과 같다. 열두 줄을 훑고 내려온 끝에서 다시
 * 올라가지 않게 하는 자리고, 장부가 늘 그렇게 생겨서 읽는 법을 따로 배우지 않는다. 달 줄은
 * 눌러 그달로 가지만 합계 줄에는 갈 곳이 없어 안 눌린다.
 *
 * 주·월에는 이 함수를 안 부른다 — 거기는 목록이 짧아 끝까지 가도 위가 아직 화면에 있다.
 */

export type PayrollMonthRow = {
  month: string;
  amount: number;
};

export type PayrollYearRow =
  | { type: "month"; month: string; title: string; amountLabel: string }
  | { type: "total"; amountLabel: string };

export function yearRows(months: readonly PayrollMonthRow[]): PayrollYearRow[] {
  const descending = [...months].sort((left, right) =>
    left.month < right.month ? 1 : -1,
  );
  const total = months.reduce((sum, row) => sum + row.amount, 0);

  return [
    ...descending.map((row): PayrollYearRow => ({
      type: "month",
      month: row.month,
      title: `${Number(row.month.slice(5, 7))}월`,
      amountLabel: spellAmount(row.amount),
    })),
    { type: "total", amountLabel: spellAmount(total) },
  ];
}
