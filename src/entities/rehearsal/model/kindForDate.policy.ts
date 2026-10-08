import type { RehearsalKind } from "@/entities/rehearsal/model/rehearsal.type";

export type KindAssignment = {
  workDate: string;
  kind: string;
  endedAt: string | null;
};

export function kindForDate(
  date: string,
  assignments: readonly KindAssignment[],
): RehearsalKind {
  const working = assignments.some(
    (assignment) =>
      assignment.workDate === date &&
      assignment.kind === "regular" &&
      assignment.endedAt === null,
  );

  return working ? "count" : "time";
}
