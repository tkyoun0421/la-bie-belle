import {
  paidMinutes,
  type WorkDayHours,
} from "@/features/payrollCompute/model/paidMinutes.policy";

const ONE_ASSIGNMENT = [null];

export function assignedMinutes(day: WorkDayHours): number {
  return paidMinutes({
    assignments: ONE_ASSIGNMENT,
    day,
    adjustments: [],
    rehearsals: [],
  });
}

export function absenceMinutes(day: WorkDayHours): number {
  return -assignedMinutes(day);
}
