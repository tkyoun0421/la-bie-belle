import type { ScheduleAssignment } from "@/entities/schedule/model/schedule.type";

export type DiscardSlotAssignment = Pick<ScheduleAssignment, "endedAt">;

export type DiscardSlotJudgement = "removes_immediately" | "needs_confirmation";

export function discardSlotJudgement(
  assignments: readonly DiscardSlotAssignment[],
): DiscardSlotJudgement {
  return assignments.some((assignment) => assignment.endedAt === null)
    ? "needs_confirmation"
    : "removes_immediately";
}

export function discardSlotWarningLine(name: string): string {
  return `${name} 님 배정도 같이 사라져요`;
}
