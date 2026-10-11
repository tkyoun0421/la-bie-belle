import { groupBy } from "@/shared/utils/collect";
import type { Adjustment } from "@/entities/payroll/model/payroll.type";
import { adjustedMinutes } from "@/features/payrollCompute/model/paidMinutes.policy";

export type AdjustmentCountRow = Pick<
  Adjustment,
  "profileId" | "minutes" | "adjustedAt"
>;

function adjustedProfileCount(rows: readonly AdjustmentCountRow[]): number {
  return [...groupBy(rows, (row) => row.profileId).values()].filter(
    (mine) => adjustedMinutes(mine) !== 0,
  ).length;
}

export function adjustmentCountLine(
  rows: readonly AdjustmentCountRow[],
): string {
  const count = adjustedProfileCount(rows);

  return count === 0 ? "" : `${count}명 조정됨`;
}
