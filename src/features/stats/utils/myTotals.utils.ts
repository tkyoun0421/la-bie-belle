import type { WorkMonth } from "@/entities/schedule/model/schedule.type";
import type {
  MyWorkTotals,
  WorkAssignment,
  WorkDay,
} from "@/features/stats/model/stats.type";
import {
  computeWorkTotals,
  workInputsOf,
} from "@/features/stats/model/workTotals.policy";

export function computeMyWorkTotals(
  assignments: readonly WorkAssignment[],
  days: readonly WorkDay[],
  profileId: string,
): MyWorkTotals {
  const totals = computeWorkTotals(
    assignments.filter((assignment) => assignment.profileId === profileId),
    days,
  );

  return {
    totalMinutes: totals.totalMinutes,
    totalCount: totals.totalCount,
    byPosition: totals.byPosition.filter((row) => row.count > 0),
  };
}

export function myWorkTotalsOfMonth(
  month: WorkMonth | undefined,
  profileId: string | null,
): MyWorkTotals {
  if (profileId === null) {
    return { totalMinutes: 0, totalCount: 0, byPosition: [] };
  }

  const inputs = workInputsOf(month?.days ?? []);

  return computeMyWorkTotals(inputs.assignments, inputs.days, profileId);
}
