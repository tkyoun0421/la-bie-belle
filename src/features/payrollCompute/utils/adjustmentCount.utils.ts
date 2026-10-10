import type { Adjustment } from "@/entities/payroll/model/payroll.type";
import { adjustedMinutes } from "@/features/payrollCompute/model/paidMinutes.policy";

export type AdjustmentCountRow = Pick<
  Adjustment,
  "profileId" | "minutes" | "adjustedAt"
>;

function rowsByProfile(
  rows: readonly AdjustmentCountRow[],
): Map<string, AdjustmentCountRow[]> {
  const grouped = new Map<string, AdjustmentCountRow[]>();

  for (const row of rows) {
    const kept = grouped.get(row.profileId) ?? [];

    kept.push(row);
    grouped.set(row.profileId, kept);
  }

  return grouped;
}

function adjustedProfileCount(rows: readonly AdjustmentCountRow[]): number {
  return [...rowsByProfile(rows).values()].filter(
    (mine) => adjustedMinutes(mine) !== 0,
  ).length;
}

export function adjustmentCountLine(
  rows: readonly AdjustmentCountRow[],
): string {
  const count = adjustedProfileCount(rows);

  return count === 0 ? "" : `${count}명 조정됨`;
}
