import { groupBy } from "@/shared/utils/collect";
import type { Rehearsal } from "@/entities/rehearsal/model/rehearsal.type";

export function groupRehearsalsByDate(
  rehearsals: readonly Rehearsal[],
): Map<string, Rehearsal[]> {
  return groupBy(rehearsals, (rehearsal) => rehearsal.workDate);
}
