import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";

export type KindAssignment = {
  work_date: string;
  kind: string;
  ended_at: string | null;
};

export function kindForDate(
  date: string,
  assignments: readonly KindAssignment[],
): RehearsalKind {
  const working = assignments.some(
    (assignment) =>
      assignment.work_date === date &&
      assignment.kind === "regular" &&
      assignment.ended_at === null,
  );

  return working ? "count" : "time";
}
