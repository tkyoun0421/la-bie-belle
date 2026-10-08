import type {
  MyWorkTotals,
  WorkAssignment,
  WorkDay,
} from "@/features/stats/model/stats.type";
import { computeWorkTotals } from "@/features/stats/model/workTotals.policy";

export function computeMyWorkTotals(
  assignments: readonly WorkAssignment[],
  days: readonly WorkDay[],
  profileId: string,
): MyWorkTotals {
  const totals = computeWorkTotals(
    assignments.filter((assignment) => assignment.profile_id === profileId),
    days,
  );

  return {
    totalMinutes: totals.totalMinutes,
    totalCount: totals.totalCount,
    byPosition: totals.byPosition.filter((row) => row.count > 0),
  };
}
