/**
 * 자리를 버리는 손짓의 데이터 판정이다. 정본은
 * `docs/2-design/modules/schedule/screens/scheduleAdmin.md`의 「잠금과 구조 변경」 —
 * 「빈 자리는 놓는 순간 사라지고, 사람이 든 자리는 시트가 확인한다」다.
 *
 * 문구는 「날 상세 문안」의 「배정 있는 자리 버릴 때」 행 그대로다.
 */

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
