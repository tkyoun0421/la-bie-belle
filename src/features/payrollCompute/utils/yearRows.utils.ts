import { groupBy } from "@/shared/utils/collect";
import { spellWon } from "@/shared/utils/spellNumber";

export type PayrollMonthRow = {
  month: string;
  amount: number;
};

export function monthRowsOfDays(
  days: readonly { date: string; amount: number }[],
): PayrollMonthRow[] {
  return [...groupBy(days, (day) => day.date.slice(0, 7))].map(
    ([month, group]) => ({
      month,
      amount: group.reduce((sum, day) => sum + day.amount, 0),
    }),
  );
}

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
      amountLabel: spellWon(row.amount),
    })),
    { type: "total", amountLabel: spellWon(total) },
  ];
}
