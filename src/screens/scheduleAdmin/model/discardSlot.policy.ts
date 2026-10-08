export type DiscardSlotAssignment = {
  ended_at: string | null;
};

export type DiscardSlotJudgement = "removes_immediately" | "needs_confirmation";

export function discardSlotJudgement(
  assignments: readonly DiscardSlotAssignment[],
): DiscardSlotJudgement {
  return assignments.some((assignment) => assignment.ended_at === null)
    ? "needs_confirmation"
    : "removes_immediately";
}

export function discardSlotWarningLine(name: string): string {
  return `${name} 님 배정도 같이 사라져요`;
}
